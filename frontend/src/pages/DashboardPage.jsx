import { useEffect, useState, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { useAuth } from '../hooks/useAuth'
import { fetchDashboardMetrics, fetchFilteredTasks, fetchCategories } from '../api'
import { formatDateTime } from '../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function DashboardPage() {
  const { currentUser, isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    setError('')
    try {
      const [tasksData, metricsData] = await Promise.all([
        fetchFilteredTasks(),
        fetchDashboardMetrics(),
      ])
      setTasks(tasksData)
      setMetrics(metricsData)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
    <section className="page-section">
      <p className="dashboard-greeting">Good Morning, {currentUser?.name || 'User'}</p>

      {error && <p className="notice error">{error}</p>}
      {isLoading && <p className="notice">Loading dashboard...</p>}

      {!isLoading && metrics && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <p>Total Projects</p>
              <h3>{metrics.total_tasks || 0}</h3>
            </div>
            <div className="metric-card">
              <p>Completed</p>
              <h3>{metrics.completed_tasks || 0}</h3>
            </div>
            <div className="metric-card">
              <p>Inprogress</p>
              <h3>{(metrics.total_tasks || 0) - (metrics.completed_tasks || 0) - (metrics.pending_tasks || 0)}</h3>
            </div>
            <div className="metric-card">
              <p>Overdue</p>
              <h3>{metrics.overdue_tasks || 0}</h3>
            </div>
          </div>

          <div className="dashboard-charts two-col">
            <div className="dashboard-chart panel-soft">
              <h3>Project Distribution</h3>
              <div className="distribution-wrap">
                <div
                  className="distribution-circle"
                  style={{
                    background: `conic-gradient(#16a34a 0 ${metrics.completion_percentage || 0}%, #d97706 ${metrics.completion_percentage || 0}% ${(metrics.completion_percentage || 0) + 20}%, #7c3aed ${(metrics.completion_percentage || 0) + 20}% 100%)`,
                  }}
                >
                  <span>{metrics.total_tasks || 0}</span>
                </div>
                <ul className="distribution-legend">
                  <li><span className="legend-dot completed" />Completed ({metrics.completed_tasks || 0})</li>
                  <li><span className="legend-dot inprogress" />Pending ({metrics.pending_tasks || 0})</li>
                  <li><span className="legend-dot todo" />Overdue ({metrics.overdue_tasks || 0})</li>
                </ul>
              </div>
            </div>

            {priorityBarData && (
              <div className="dashboard-chart panel-soft">
                <h3>Priority Bar Graph</h3>
                <div className="bar-graph-wrap">
                  <Bar data={priorityBarData} options={priorityBarOptions} />
                </div>
              </div>
            )}
          </div>

          <div className="dashboard-table panel-soft">
            <h3>Projects Table</h3>
            <table>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 10).map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td><span className={`priority ${task.priority}`}>{task.priority || 'medium'}</span></td>
                    <td>{task.category?.name || 'Uncategorized'}</td>
                    <td>{formatDateTime(task.created_at)}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={4}>No projects yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default DashboardPage
