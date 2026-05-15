require('dotenv').config();

async function verify() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmMjdmMTQ4LTBlMDEtNDM4Ni1hZmYwLWRmNmE1ZTcwNTg5MyIsImVtYWlsIjoicHJvZmVzb3JAbGFwYXouZWR1LmJvIiwicm9sIjoiUFJPRkVTT1IiLCJpYXQiOjE3Nzg0MzQzNDcsImV4cCI6MTc3ODQzNzk0N30.Iz6TQGsjR2cIs2JUbx5ZNkKS_KuHObDGJZKMV2bJ0fI';
  
  try {
    const response = await fetch('http://localhost:3000/api/notas/mis-materias', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('ENDPOINT_RESPONSE:', JSON.stringify(data, null, 2));
    } else {
      console.error('ENDPOINT_ERROR:', data);
    }
  } catch (error) {
    console.error('FETCH_ERROR:', error.message);
  }
}

verify();
