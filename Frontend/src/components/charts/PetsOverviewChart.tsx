import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface PetsOverviewChartProps {
  data: {
    found: number;
    lost: number;
    adoptable: number;
    adopted: number;
  };
}

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0'];

export function PetsOverviewChart({ data }: PetsOverviewChartProps) {
  const chartData = [
    { name: 'Found', value: data.found, color: COLORS[0] },
    { name: 'Lost', value: data.lost, color: COLORS[1] },
    { name: 'Adoptable', value: data.adoptable, color: COLORS[2] },
    { name: 'Adopted', value: data.adopted, color: COLORS[3] },
  ];

  const lineChartData = [
    { month: 'Jan', found: data.found * 0.8, lost: data.lost * 0.9 },
    { month: 'Feb', found: data.found * 0.85, lost: data.lost * 0.95 },
    { month: 'Mar', found: data.found * 0.9, lost: data.lost },
    { month: 'Apr', found: data.found * 0.95, lost: data.lost * 1.05 },
    { month: 'May', found: data.found, lost: data.lost * 1.1 },
    { month: 'Jun', found: data.found * 1.05, lost: data.lost * 1.15 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pets Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4CAF50" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

