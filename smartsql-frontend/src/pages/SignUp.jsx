import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

export default function SignUp() {
  const [formData, setFormData] = useState({})
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', 
      {
        method: 'POST',
        headers:  {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      const data = await res.json();
      if (data.success === false) {
        setLoading(false);
        setError(data.message);
        return;
      } else {
      setLoading(false);
      setError(null);
      navigate('/sign-in');
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  };
  
  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl text-center font-semibold my-7'>Sign Up</h1>
      <form onSubmit={handleSubmit} className='flex flex-col mx-auto gap-4 w-1/2 md:w-96'>
        <input 
          type="text" 
          placeholder='username' 
          className='border p-3 rounded-lg' 
          id='username' 
          onChange={handleChange}
        />
        <input type="text" 
          placeholder='email' 
          className='border p-3 rounded-lg' 
          id='email' onChange={handleChange}
        />
        <input 
          type="text" 
          placeholder='password' 
          className='border p-3 rounded-lg' 
          id='password' 
          onChange={handleChange}
        />
        <button disabled={loading} className='bg-slate-700 text-gray-100 p-3 rounded-md uppercase hover:opacity-90 disabled::opacity-70'> 
          {loading? 'Loading...' : 'Sign Up' } 
        </button>
        <OAuth/>
      </form>
      <div className='flex gap-3 mx-auto w-1/2 md:w-96 mt-4'>
        <p>Have an account?</p>
        <Link to='/sign-in'>
          <span className="text-blue-500">Sign In</span>
        </Link>
      </div>
      {error && <p className="text-red-500 mx-auto w-1/2 md:w-96 mt-5">{ error }</p> }
    </div>
  )
}
 