import React, { useEffect } from 'react';
// Import cái AppRouter chứa mọi đường dẫn mà chúng ta đã cất công làm nãy giờ
import AppRouter from './routes/AppRouter'; 

function App() {
  return (
    <div className="App">
      {/* Gọi toàn bộ hệ thống định tuyến (Routes) vào đây */}
      <AppRouter />
    </div>
  );
}

export default App;