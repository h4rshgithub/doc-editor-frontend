// import React, { useState, useEffect } from 'react';
// import { db, auth } from './firebase';
// import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import { signOut } from 'firebase/auth';

// const DocList = () => {
//   const [docs, setDocs] = useState([]);
//   const navigate = useNavigate();
//   const user = auth.currentUser;

//   useEffect(() => {
//     const fetchDocs = async () => {
//       if (!user) {
//         navigate('/login');
//         return;
//       }
//       try {
//         const q = query(collection(db, 'docs'), where('ownerId', '==', user.uid));
//         const querySnapshot = await getDocs(q);
//         const docList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//         setDocs(docList);
//       } catch (error) {
//         console.error("Docs fetch mein lafda: ", error.message);
//         setDocs([]);
//       }
//     };
//     fetchDocs();
//   }, [user, navigate]);

//   const createNewDoc = async () => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }
//     try {
//       const docRef = await addDoc(collection(db, 'docs'), {
//         content: JSON.stringify({ ops: [] }),
//         ownerId: user.uid,
//       });
//       navigate(`/doc/${docRef.id}`);
//     } catch (error) {
//       console.error("Doc create mein lafda: ", error.message);
//     }
//   };

//   const handleLogout = async () => {
//     await signOut(auth);
//     navigate('/login');
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Your Documents</h1>
//           <button
//             onClick={handleLogout}
//             className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
//           >
//             Logout
//           </button>
//         </div>
//         <button
//           onClick={createNewDoc}
//           className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mb-6"
//         >
//           Create New Document
//         </button>
//         <ul className="space-y-4">
//           {docs.map((doc) => (
//             <li key={doc.id} className="bg-white p-4 rounded-lg shadow">
//               <a
//                 href={`/doc/${doc.id}`}
//                 className="text-blue-600 hover:underline"
//               >
//                 Document ID: {doc.id}
//               </a>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default DocList;
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

const DocList = () => {
  const [docs, setDocs] = useState([]);
  const [docName, setDocName] = useState(''); // State for document name input
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchDocs = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        const q = query(collection(db, 'docs'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const docList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDocs(docList);
      } catch (error) {
        console.error("Docs fetch mein lafda: ", error.message);
        setDocs([]);
      }
    };
    fetchDocs();
  }, [user, navigate]);

  const createNewDoc = async () => {
    console.log("Create New Document clicked!");
    if (!user) {
      console.log("User nahi hai, redirect to /login");
      navigate('/login');
      return;
    }
    if (!docName.trim()) {
      alert("Please enter a document name");
      return;
    }
    try {
      console.log("Creating new doc...");
      const docRef = await addDoc(collection(db, 'docs'), {
        content: JSON.stringify({ ops: [] }),
        ownerId: user.uid,
        allowLinkAccess: false,
        sharedWith: [],
        name: docName, // Add document name
      });
      console.log("Doc created with ID:", docRef.id);
      setDocName(''); // Clear input after creating
      navigate(`/doc/${docRef.id}`);
    } catch (error) {
      console.error("Doc create mein lafda: ", error.message);
      alert("Document create karne mein dikkat hui: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-indigo-600 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold tracking-tight">DocSync</h1>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-white font-medium hover:underline">
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Home - Your Documents</h1>
          <div className="mb-6">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Enter document name"
              className="p-2 border border-gray-300 rounded mr-2"
            />
            <button
              onClick={() => {
                console.log("Button clicked!");
                createNewDoc();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Create New Document
            </button>
          </div>
          <ul className="space-y-4">
            {docs.map((doc) => (
              <li key={doc.id} className="bg-white p-4 rounded-lg shadow">
                <Link
                  to={`/doc/${doc.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {doc.name || "Untitled Document"} (ID: {doc.id})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocList;