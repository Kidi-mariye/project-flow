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
          backgroundColor: ['#dc2626', '#d97706', '#16a34a'],
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
        ticks: { color: '#374151', font: { weight: 700 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
          color: '#4b5563',
        },
        grid: { color: 'rgba(100, 116, 139, 0.2)' },
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
                <div className="mc-icon" style={{ background: '#EEEDFE' }}>
                  📁
                </div>
                <div className="mc-val">{metrics.total_tasks || 0}</div>
                <div className="mc-label">Active projects</div>
                <div className="mc-trend up">↑ {metrics.added_this_month || 0} added this month</div>
              </div>

              <div className="mc">
                <div className="mc-icon" style={{ background: '#FCEBEB' }}>
                  ⚠️
                </div>
                <div className="mc-val">{metrics.overdue_tasks || 0}</div>
                <div className="mc-label">Overdue tasks</div>
                <div className="mc-trend dn">{metrics.overdue_trend || ''}</div>
              </div>

              <div className="mc">
                <div className="mc-icon" style={{ background: '#E1F5EE' }}>
                  ⏱️
                </div>
                <div className="mc-val">{metrics.hours_logged || '—'}</div>
                <div className="mc-label">Hours logged (week)</div>
                <div className="mc-trend up">Team avg: {metrics.team_avg_hours || '—'}</div>
              </div>

              <div className="mc">
                <div className="mc-icon" style={{ background: '#FAEEDA' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 80, height: 80 }}>
                    <Doughnut data={{ datasets: [{ data: [metrics.completed_tasks || 0, metrics.pending_tasks || 0, metrics.overdue_tasks || 0], backgroundColor: ['#639922', '#378ADD', '#D3D1C7'] }] }} options={{ responsive: false, cutout: '72%', plugins: { legend: { display: false } } }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#639922', display: 'inline-block' }} />Completed</span>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{Math.round(((metrics.completed_tasks || 0) / Math.max(1, (metrics.total_tasks || 1))) * 100)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#378ADD', display: 'inline-block' }} />In progress</span>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{metrics.pending_tasks || 0}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: '#D3D1C7', display: 'inline-block' }} />To do</span>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{metrics.to_do_percentage || 0}%</span>
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
                    <div className="pdot" style={{ background: ['#378ADD','#7F77DD','#1D9E75','#E24B4A','#BA7517'][i%5] }}></div>
                    <div className="pname">{t.title}</div>
                    <div className="pbar"><div className="pbfill" style={{ width: `${Math.min(100, (t.progress_percent||0))}%`, background: ['#378ADD','#7F77DD','#1D9E75','#E24B4A','#BA7517'][i%5] }}></div></div>
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
                  <div className="wrow"><div className="wname">You</div><div className="wtrack"><div className="wfill" style={{ width: '60%', background:'#E6F1FB' }}><span className="wlabel" style={{ color:'#185FA5' }}>6 tasks</span></div></div></div>
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
