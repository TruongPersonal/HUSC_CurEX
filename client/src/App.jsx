import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [status, setStatus] = useState('Checking backend connection...')

  useEffect(() => {
    axios.get('http://localhost:8080/api/health')
      .then(res => setStatus(`Backend Status: ${res.data.status} at ${res.data.time}`))
      .catch(err => {
        const errorMsg = err.response?.data?.error || err.message;
        setStatus(`Backend Lỗi: ${errorMsg}`);
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">HUSC CurEX</h1>
        <p className="text-gray-600 mb-6">Hệ thống Trao đổi Giáo trình Đại học Khoa học, Đại học Huế</p>
        
        <div className={`p-3 rounded-lg text-sm font-medium ${status.includes('Connected') || status.includes('connected') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status}
        </div>
      </div>
    </div>
  )
}

export default App
