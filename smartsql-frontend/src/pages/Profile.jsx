import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector} from 'react-redux';
import { updateUserFailure, updateUserStart, updateUserSuccess, deleteUserFailure, deleteUserStart, deleteUserSuccess, signOutUserFailure, signOutUserStart, signOutUserSuccess } from "../redux/user/userSlice.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { app } from '../firebase.js';

export default function Profile() {

  const fileRef = useRef(null);
  const [file, setFile] = useState(undefined);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [formData, setFormData] = useState({});
  const [userUploadSuccess, setUserUploadSuccess] = useState(false);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [showListingError, setShowListingError] = useState(null);
  const [userListing, setUserListing] = useState([]);
  const [deleteListingError, setDeleteListingError] = useState(null);
  const [editListingError, setEditListingError] = useState(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    setFileUploadError(null);
    const storage = getStorage(app);
    const fileName = new Date().getTime + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);
 
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadPercentage(Math.round(progress));
    },
    (error) => {
      setFileUploadError(error);
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then(
        (downloadURL) => setFormData({...formData, photo: downloadURL})
      )
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value, 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateUserStart());
    try {
      const res = await fetch(`/api/user/update/${currentUser._id}`, 
      {
        method: 'POST',
        headers:  {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      } 
      dispatch(updateUserSuccess(data));
      setUserUploadSuccess(true);
      navigate('/profile')
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async () => {
    dispatch(deleteUserStart());
    try {
      const res = await fetch(`/api/user/delete/${currentUser._id}`, 
      {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      } 
      dispatch(deleteUserSuccess());
      navigate('/sign-in')
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  }

  const handleSignOut = async () => {
    dispatch(signOutUserStart());
    try {
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(signOutUserFailure(data.message));
        return;
      } 
      dispatch(signOutUserSuccess(data));
      navigate('/sign-in')
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  }

  const handleShowListings = async () => {
    try {
      setShowListingError(null);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();
      if (data.success === false) {
        setShowListingError(data.message);
        return;
      } 
      setUserListing(data);
    } catch (error) {
      setShowListingError(error);
    }
  }

  const handleListingDelete = async (listingId) => {
    setDeleteListingError(null);
    try {
      const res = await fetch(`/api/listings/delete/${listingId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success === false) {
        setDeleteListingError(data.message);
        console.log(deleteListingError)
        return;
      }
      setUserListing((userListing) => userListing.filter((listing) => listing._id !== listingId))
    } catch (error) {
      setDeleteListingError(error)
      console.log(deleteListingError)
    }
  }

  return (
    
    <div className='p-3 max-w-lg mx-auto'>
      <script src="../path/to/flowbite/dist/flowbite.min.js"></script>
      <h1 className='text-3xl text-center font-semibold m-4 mt-6'>Profile</h1>
      <input onChange={(e) => setFile(e.target.files[0])} type="file" ref={fileRef} hidden accept="image/*"/>
      <img onClick={() => fileRef.current.click()} className="rounded-full mx-auto h-24 w-24 mt-6 cursor-pointer" src={formData.photo || currentUser.photo} alt="profile" />
      <p className="self-center mt-3 mx-auto">
        {fileUploadError? 
          <span className="text-center text-red-500"> Failed! Error Occurs.</span> : 
          (uploadPercentage > 0 && uploadPercentage < 100)? 
            <span className="text-slate-500">{`Uploading ${uploadPercentage}%`}</span> :
              (uploadPercentage === 100)? 
                <span className="text-center text-green-500">Profile image successfully uploaded!</span> : ""}
      </p>
      <form onSubmit={handleSubmit} className='flex flex-col mt-4 gap-4'>
        <input type="text" 
          placeholder='username' 
          defaultValue={currentUser.username}
          className='border p-3 rounded-lg' 
          id='username' onChange={handleChange}
        />
        <input type="text" 
          placeholder='email' 
          defaultValue={currentUser.email}
          className='border p-3 rounded-lg' 
          id='email' onChange={handleChange}
        />
        <input 
          type="password" 
          placeholder='password'  
          className='border p-3 rounded-lg' 
          id='password' 
          onChange={handleChange}
        />
        <button disabled={loading} className='bg-slate-700 text-gray-100 p-3 rounded-md uppercase hover:opacity-90 disabled:opacity-70'> 
          {loading? 'Uploading...' : 'Update' } 
        </button>
        <Link className='bg-green-700 text-gray-100 p-3 rounded-md uppercase hover:opacity-90 disabled:opacity-70 text-center' to='/create-listing'>Create the listing
        </Link>
      </form>
      <div className='flex gap-3 justify-between mx-auto mt-4 text-red-500'>
        <button onClick={() => setIsOpen(true)} data-modal-target="popup-modal" data-modal-toggle="popup-modal" className="cursor-pointer">Delete account?</button>
        {modalIsOpen && 
          <div id="popup-modal" className={`fixed flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black bg-opacity-50 ${modalIsOpen ? '' : 'hidden'}`}>
            <div className="relative p-4 w-1/4 max-h-full">
              <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <button type="button" onClick={() => setIsOpen(false)} className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="popup-modal">
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="p-4 md:p-5 text-center">
                  <svg className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                  <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this product?</h3>
                  <button data-modal-hide="popup-modal" onClick={handleDeleteUser} type="button" className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
                      Yes, I'm sure
                  </button>
                  <button data-modal-hide="popup-modal" type="button" onClick={() => setIsOpen(false)} className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">No, cancel</button>
                </div>
              </div>
            </div>
          </div>
        }
        <Link to='/sign-in'>
          <span onClick={handleSignOut} className="cursor-pointer">Sign out</span>
        </Link>
      </div>
      <p className="self-center mt-6">
        {error? 
          <span className="text-red-500"> {error}</span> : 
          userUploadSuccess? <span className="text-green-500">User is successfully updated!</span> : ''}
      </p>
      <div>
        <button onClick={handleShowListings} className='text-green-700 w-full mb-6'>Show Listings</button>
        {userListing.length > 0 && 
        <div className="flex flex-col gap-6">
          <h1 className="text-center font-semibold text-slate-700 text-xl mt-3">Your Listings</h1>
            {userListing.map((listing) => (
            <div key={listing._id} className="flex gap-5 justify-between items-center border rounded-lg p-3">
                <Link to={`/listings/${listing._id}`}> 
                  <img src={listing.imageUrls[0]}  alt="listing cover" className="h-16 w-16 object-contain "/> 
                </Link>
                <Link className="text-slate-700 font-semibold flex-1 hover:underline truncate" to={`/listings/${listing._id}`}> 
                  <p >{listing.name}</p>
                </Link>
                <div className="flex flex-col items-center">
                  <button onClick={() => handleListingDelete(listing._id)} type='button' className="hover:opacity-60 rounded-lg text-red-700 uppercase text-sm">Delete</button>
                  <Link to={`/update-listing/${listing._id}`}>
                    <button type='button' className="hover:opacity-60 rounded-lg text-green-700 uppercase text-sm">Edit</button>
                  </Link>
                  </div>
            </div>
            ))}
        </div> }
      </div>
    </div>
  )
}
