import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { NotificationSocketListener } from './components/NotificationSocketListener'

export default function App() {
  return (
    <BrowserRouter>
      <NotificationSocketListener />
      <AppRoutes />
    </BrowserRouter>
  )
}
