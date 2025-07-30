import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { formatWeight, formatPercent } from '@/utils/format';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Material colors
const materialColors = {
  'Plastic': '#3B82F6',
  'Paper': '#10B981',
  'Metal': '#F59E0B',
  'Glass': '#8B5CF6',
  'Specialty Materials': '#EC4899',
  'Other': '#6B7280',
  'Contamination': '#EF4444'
};

export default function MaterialBreakdown({ data }) {
  // Group by material category
  const groupedData = data.reduce((acc, item) => {
    const key = item.material || 'Other';
    if (!acc[key]) {
      acc[key] = {
        material: key,
        total_weight: 0,
        percentage: 0
      };
    }
    acc[key].total_weight += item.total_weight;
    return acc;
  }, {});

  const materials = Object.values(groupedData).sort((a, b) => b.total_weight - a.total_weight);
  const totalWeight = materials.reduce((sum, m) => sum + m.total_weight, 0);

  // Calculate percentages
  materials.forEach(m => {
    m.percentage = totalWeight > 0 ? (m.total_weight / totalWeight) * 100 : 0;
  });

  const chartData = {
    labels: materials.map(m => m.material),
    datasets: [
      {
        data: materials.map(m => m.total_weight),
        backgroundColor: materials.map(m => materialColors[m.material] || materialColors.Other),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const percentage = materials[i].percentage;
                return {
                  text: `${label} (${formatPercent(percentage)})`,
                  fillStyle: dataset.backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const material = materials[context.dataIndex];
            return [
              `${material.material}: ${formatWeight(material.total_weight)}`,
              `${formatPercent(material.percentage)} of total`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}