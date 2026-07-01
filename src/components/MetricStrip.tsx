type Metric = {
  label: string
  value: string | number
}

type MetricStripProps = {
  metrics: Metric[]
}

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <section className="metric-strip">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </section>
  )
}

