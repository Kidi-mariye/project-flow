import { useEffect, useMemo } from 'react'
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
  const { currentUser, isAuthenticated } = useAuth()
  const { tasks, isLoading: tasksLoading, error: tasksError, loadTasks } = useTasks()
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useFetch(fetchDashboardMetrics, null)

  const isLoading = tasksLoading || metricsLoading
  const error = tasksError || metricsError

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks()
      refetchMetrics()
    }
  }, [isAuthenticated])

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
                <div className="card-hd"><span className="card-title">All projects</span><span className="card-link">View all →</span></div>
                {tasks.slice(0,5).map((t, i) => (
                    <div className="prow" key={t.id}>
                  <div className="pdot" style={{ background: ['var(--primary-600)','var(--indigo-400)','var(--indigo-200)','var(--primary-500)','var(--indigo-300)'][i%5] }}></div>
                    <div className="pname">{t.title}</div>
                  <div className="pbar"><div className="pbfill" style={{ width: `${Math.min(100, (t.progress_percent||0))}%`, background: ['var(--primary-600)','var(--indigo-400)','var(--indigo-200)','var(--primary-500)','var(--indigo-300)'][i%5] }}></div></div>
                    <div className="ppct">{t.progress_percent || 0}%</div>
                    <span className={`pill ${t.status === 'ontrack' ? 'pill-g' : t.status === 'at-risk' ? 'pill-a' : 'pill-r'}`}>{t.status_label || 'On track'}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-hd"><span className="card-title">My tasks</span><span className="card-link">+ Add</span></div>
                {tasks.slice(0,5).map((t) => (
                  <div className="trow" key={`t-${t.id}`}>
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
          </>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
