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
            tokenToHex('--status-blocked') || 'rgb(220,38,38)',
            tokenToHex('--status-at-risk') || 'rgb(245,158,11)',
            tokenToHex('--status-done') || 'rgb(22,163,74)'
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
                  📁
                </div>
                <div className="mc-val">{metrics.total_tasks || 0}</div>
                <div className="mc-label">Active projects</div>
                <div className="mc-trend up">↑ {metrics.added_this_month || 0} added this month</div>
              </div>

              <div className="mc">
                <div className="mc-icon mc-icon--danger">
                  ⚠️
                </div>
                <div className="mc-val">{metrics.overdue_tasks || 0}</div>
                <div className="mc-label">Overdue tasks</div>
                <div className="mc-trend dn">{metrics.overdue_trend || ''}</div>
              </div>

              <div className="mc">
                <div className="mc-icon mc-icon--ok">
                  ⏱️
                </div>
                <div className="mc-val">{metrics.hours_logged || '—'}</div>
                <div className="mc-label">Hours logged (week)</div>
                <div className="mc-trend up">Team avg: {metrics.team_avg_hours || '—'}</div>
              </div>

              <div className="mc">
                <div className="mc-icon mc-icon--warn">
                  👥
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
                            tokenToHex('--status-done') || '#16A34A', 
                            tokenToHex('--primary-500') || '#6366F1', 
                            tokenToHex('--slate-200') || '#E2E8F0'
                          ],
                          borderColor: [
                            'rgba(22,163,74,0.3)',
                            'rgba(99,102,241,0.3)',
                            'rgba(226,232,240,0.5)'
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
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--status-done)' }}>{metrics.completed_tasks || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="legend-square legend-square--progress" />In progress</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary-500)' }}>{metrics.pending_tasks || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}><span className="legend-square legend-square--todo" />To do</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--slate-500)' }}>{metrics.overdue_tasks || 0}</span>
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
                    <div className="pdot" style={{ background: ['var(--primary-500)','var(--status-review)','var(--status-done)','var(--status-blocked)','var(--status-at-risk)'][i%5] }}></div>
                    <div className="pname">{t.title}</div>
                    <div className="pbar"><div className="pbfill" style={{ width: `${Math.min(100, (t.progress_percent||0))}%`, background: ['var(--primary-500)','var(--status-review)','var(--status-done)','var(--status-blocked)','var(--status-at-risk)'][i%5] }}></div></div>
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
