import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  ArcElement,
} from 'chart.js'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useTasks } from '../hooks/useTasks'
import { useNotifications } from '../hooks/useNotifications'
import { fetchDashboardMetrics } from '../api'
import { formatDateTime } from '../utils/helpers'

import './dashboard.css'
import { tokenToHex, tokenToRGBA } from '../utils/colors'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

ChartJS.register(ArcElement)

function MetricGlyph({ variant }) {
  const sharedProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (variant) {
    case 'projects':
      return (
        <svg {...sharedProps} aria-hidden="true">
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
      )
    case 'overdue':
      return (
        <svg {...sharedProps} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      )
    case 'hours':
      return (
        <svg {...sharedProps} aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.5v4.5l3 2" />
        </svg>
      )
    case 'team':
      return (
        <svg {...sharedProps} aria-hidden="true">
          <path d="M16 19a4 4 0 0 0-8 0" />
          <circle cx="12" cy="9" r="3" />
          <circle cx="18" cy="11" r="2" />
        </svg>
      )
    default:
      return null
  }
}

function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser, isAuthenticated } = useAuth()
  const { tasks, isLoading: tasksLoading, error: tasksError, loadTasks } = useTasks()
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useFetch(fetchDashboardMetrics, null)
  const {
    notifications: reminderNotifications,
    unreadCount: reminderUnreadCount,
    isLoading: remindersLoading,
    error: remindersError,
    loadNotifications: loadReminderNotifications,
    markAsRead: markReminderAsRead,
    markAllAsRead: markAllRemindersAsRead,
  } = useNotifications()

  const [showReminderModal, setShowReminderModal] = useState(false)
  const prevUnreadRef = useRef(0)

  const isLoading = tasksLoading || metricsLoading || remindersLoading
  const error = tasksError || metricsError || remindersError

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks()
      refetchMetrics()
      loadReminderNotifications({
        per_page: 5,
        type: 'App\\Notifications\\TaskReminderNotification',
      })
      .then((res) => {
        const items = res?.data || []
        const unread = items.filter((n) => !n.read_at).length
        // dispatch unread count globally for topbar
        try { window.dispatchEvent(new CustomEvent('reminderCount', { detail: { count: unread } })) } catch (e) {}
        prevUnreadRef.current = unread
        if (unread > 0) setShowReminderModal(true)
      })
    }
  }, [isAuthenticated])

  // Listen for programmatic open requests from the topbar
  useEffect(() => {
    const handler = () => setShowReminderModal(true)
    window.addEventListener('openReminders', handler)
    return () => window.removeEventListener('openReminders', handler)
  }, [])

  // When reminder notifications change, update global unread count
  useEffect(() => {
    const unread = (reminderNotifications || []).filter((n) => !n.read_at).length
    try { window.dispatchEvent(new CustomEvent('reminderCount', { detail: { count: unread } })) } catch (e) {}
    prevUnreadRef.current = unread
  }, [reminderNotifications])

  // Poll for reminders every minute and show a native notification when new unread reminders arrive
  useEffect(() => {
    if (!isAuthenticated) return undefined

    let mounted = true

    const fetchAndNotify = async () => {
      try {
        const res = await loadReminderNotifications({ per_page: 5, type: 'App\\Notifications\\TaskReminderNotification' })
        if (!mounted) return
        const items = res?.data || []
        const unread = items.filter((n) => !n.read_at).length
        try { window.dispatchEvent(new CustomEvent('reminderCount', { detail: { count: unread } })) } catch (e) {}

        if (unread > prevUnreadRef.current) {
          const first = items.find((n) => !n.read_at)
          if (first && 'Notification' in window) {
            const title = 'Project deadline soon'
            const body = first.data?.message || first.data?.title || 'A project deadline is approaching.'
            if (Notification.permission === 'granted') {
              try { new Notification(title, { body }) } catch (e) {}
            } else if (Notification.permission !== 'denied') {
              const perm = await Notification.requestPermission()
              if (perm === 'granted') {
                try { new Notification(title, { body }) } catch (e) {}
              }
            }
          }
          setShowReminderModal(true)
        }

        prevUnreadRef.current = unread
      } catch (err) {
        // ignore
      }
    }

    // Run immediately and then every minute
    fetchAndNotify()
    const id = setInterval(fetchAndNotify, 60 * 1000)
    return () => { mounted = false; clearInterval(id) }
  }, [isAuthenticated, loadReminderNotifications])

  const priorityBarData = useMemo(() => {
    if (!metrics) return null
    const counts = metrics.tasks_by_priority || {}
    return {
      labels: ['High', 'Medium', 'Low'],
      datasets: [
        {
          label: 'Projects',
          data: [counts.high || 0, counts.medium || 0, counts.low || 0],
          backgroundColor: [
            tokenToHex('--primary-600') || 'rgb(79,70,229)',
            tokenToHex('--indigo-400') || 'rgb(129,140,248)',
            tokenToHex('--indigo-200') || 'rgb(199,210,254)'
          ],
          borderRadius: 8,
          maxBarThickness: 56,
        },
      ],
    }
  }, [metrics])

  const priorityBarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            return `Projects: ${context.parsed.y}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--slate-700)', font: { weight: 700 } },
      },
      y: {
        beginAtZero: true,
          ticks: {
          precision: 0,
          stepSize: 1,
          color: 'var(--slate-500)',
        },
        grid: { color: 'rgba(75,85,99,0.12)' },
      },
    },
  }), [])

  return (
    <div className="dash">
      <div className="content">
        {error && <p className="notice error">{error}</p>}
        {isLoading && <p className="notice">Loading dashboard...</p>}

        {!isLoading && metrics && (
          <>
            <div className="metrics">
              <div className="mc">
                <div className="mc-icon mc-icon--primary">
                  <MetricGlyph variant="projects" />
                </div>
                <div className="mc-val">{metrics.total_tasks || 0}</div>
                <div className="mc-label">Active projects</div>
                <div className="mc-trend up">↑ {metrics.added_this_month || 0} added this month</div>
              </div>

              <div className="mc">
                <div className="mc-icon mc-icon--danger">
                  <MetricGlyph variant="overdue" />
                </div>
                <div className="mc-val">{metrics.overdue_tasks || 0}</div>
                <div className="mc-label">Overdue tasks</div>
                <div className="mc-trend dn">{metrics.overdue_trend || ''}</div>
              </div>

              <div className="mc">
                <div className="mc-icon mc-icon--ok">
                  <MetricGlyph variant="hours" />
                </div>
                <div className="mc-val">{metrics.hours_logged || '—'}</div>
                <div className="mc-label">Hours logged (week)</div>
                <div className="mc-trend up">Team avg: {metrics.team_avg_hours || '—'}</div>
              </div>

              <div className="mc">
                <div className="mc-icon mc-icon--warn">
                  <MetricGlyph variant="team" />
                </div>
                <div className="mc-val">{metrics.team_members || 0}</div>
                <div className="mc-label">Team members</div>
                <div className="mc-trend up">{metrics.active_today || 0} active today</div>
              </div>
            </div>

            <div className="row2">
              <div className="card">
                <div className="card-hd"><span className="card-title">Tasks by priority</span><span className="card-link">This week</span></div>
                <div style={{ height: 140 }}>
                  {priorityBarData && <Bar data={priorityBarData} options={priorityBarOptions} />}
                </div>
              </div>

              <div className="card">
                <div className="card-hd"><span className="card-title">Overall progress</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    <Doughnut 
                      data={{ 
                        labels: ['Completed', 'In progress', 'To do'],
                        datasets: [{ 
                          data: [metrics.completed_tasks || 0, metrics.pending_tasks || 0, metrics.overdue_tasks || 0], 
                          backgroundColor: [
                            tokenToHex('--primary-600') || '#4F46E5', 
                            tokenToHex('--indigo-400') || '#818CF8', 
                            tokenToHex('--indigo-200') || '#C7D2FE'
                          ],
                          borderColor: [
                            'rgba(79,70,229,0.3)',
                            'rgba(129,140,248,0.3)',
                            'rgba(199,210,254,0.5)'
                          ],
                          borderWidth: 2,
                          hoverBorderWidth: 3,
                          hoverOffset: 8
                        }] 
                      }} 
                      options={{ 
                        responsive: false, 
                        maintainAspectRatio: false,
                        cutout: '65%',
                        layout: { padding: 0 },
                        plugins: { 
                          legend: { display: false },
                          tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(15,23,42,0.9)',
                            titleFont: { size: 12, weight: 'bold' },
                            bodyFont: { size: 11 },
                            padding: 8,
                            displayColors: true,
                            callbacks: {
                              label(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0
                                return `${context.label}: ${context.parsed} (${percentage}%)`
                              }
                            }
                          }
                        },
                        animation: {
                          animateRotate: true,
                          animateScale: false,
                          duration: 750,
                          easing: 'easeInOutQuart'
                        }
                      }} 
                    />
                    <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-900)' }}>
                        {Math.round(((metrics.completed_tasks || 0) / Math.max(1, (metrics.total_tasks || 1))) * 100)}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-500)', marginTop: '2px' }}>Complete</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="legend-square legend-square--done" />Completed</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary-600)' }}>{metrics.completed_tasks || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="legend-square legend-square--progress" />In progress</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--indigo-400)' }}>{metrics.pending_tasks || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="legend-square legend-square--todo" />To do</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--indigo-200)' }}>{metrics.overdue_tasks || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row3">
              <div className="card">
                <div className="card-hd"><span className="card-title">All projects</span><button type="button" className="card-link" onClick={() => navigate('/tasks')}>View all →</button></div>
                {tasks.slice(0,5).map((t, i) => {
                  const progressPercent = typeof t.progress_percent !== 'undefined' && t.progress_percent !== null
                    ? Number(t.progress_percent)
                    : (t.completed ? 100 : 0)

                  return (
                    <div className="prow" key={t.id}>
                      <div className="pdot" style={{ background: ['var(--primary-600)','var(--indigo-400)','var(--indigo-200)','var(--primary-500)','var(--indigo-300)'][i%5] }}></div>
                      <div className="pname">{t.title}</div>
                      <div className="pbar"><div className="pbfill" style={{ width: `${Math.min(100, progressPercent)}%`, background: ['var(--primary-600)','var(--indigo-400)','var(--indigo-200)','var(--primary-500)','var(--indigo-300)'][i%5] }}></div></div>
                      <div className="ppct">{progressPercent}%</div>
                      <span className={`pill ${t.status === 'ontrack' ? 'pill-g' : t.status === 'at-risk' ? 'pill-a' : 'pill-r'}`}>{t.status_label || 'On track'}</span>
                    </div>
                  )
                })}
              </div>

              <div className="card">
                <div className="card-hd"><span className="card-title">My tasks</span><button type="button" className="card-link" onClick={() => navigate('/create-task')}>+ Add</button></div>
                {tasks.slice(0,5).map((t) => (
                  <div className={`trow ${t.completed ? 'done' : ''}`} key={`t-${t.id}`}>
                    <div className={`chk ${t.completed ? 'done' : ''}`}>{t.completed ? '✓' : null}</div>
                    <div className={`ttext ${t.completed ? 'done' : ''}`}>{t.title}</div>
                    <div className={`tdue ${t.due_date && new Date(t.due_date) <= new Date() ? 'hot' : ''}`}>{t.due_date ? formatDateTime(t.due_date) : 'No due'}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-hd"><span className="card-title">Team workload</span></div>
                <div id="right-panel-content">
                  <div className="wrow"><div className="wname">You</div><div className="wtrack"><div className="wfill" style={{ width: '60%', background:'var(--primary-100)' }}><span className="wlabel" style={{ color:'var(--primary-600)' }}>6 tasks</span></div></div></div>
                </div>
              </div>
            </div>

            {/* Reminder popup appears when there are unread reminder notifications */}
            {showReminderModal && reminderNotifications.length > 0 && (
              <div className="reminder-modal-overlay" role="dialog" aria-modal="true">
                <div className="reminder-modal">
                  <div className="reminder-modal-hd">
                    <h3>Deadline reminders</h3>
                    <div className="reminder-modal-actions">
                      <button type="button" className="btn ghost" onClick={async () => { await markAllRemindersAsRead(); setShowReminderModal(false); }}>
                        Mark all read
                      </button>
                      <button type="button" className="btn" onClick={() => setShowReminderModal(false)}>Close</button>
                    </div>
                  </div>

                  <div className="reminder-modal-body">
                    {reminderNotifications.filter(n => !n.read_at).map((notification) => (
                      <article key={notification.id} className="reminder-row">
                        <div className="reminder-row-main">
                          <div className="reminder-title">{notification.data?.title || 'Project reminder'}</div>
                          <div className="reminder-message">{notification.data?.message || 'Your project deadline is approaching.'}</div>
                          <div className="reminder-meta">{notification.data?.due_date ? `Due: ${formatDateTime(notification.data.due_date)}` : ''}</div>
                        </div>
                        <div className="reminder-row-actions">
                          <button type="button" className="btn ghost" onClick={async () => { await markReminderAsRead(notification.id); }}>
                            Mark read
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
