interface Props {
    title: string
    value: string | number
    icon: string
    color: string
  }
  
  const StatCard = ({ title, value, icon, color }: Props) => {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        </div>
      </div>
    )
  }
  
  export default StatCard