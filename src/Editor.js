import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import io from 'socket.io-client';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import _ from 'lodash';

import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket'],
  secure: true, // HTTPS ke liye secure connection
});

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [user, setUser] = useState(auth.currentUser);
  const [accessDenied, setAccessDenied] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [allowLinkAccess, setAllowLinkAccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [docName, setDocName] = useState('');
  const lastSentDelta = useRef(null); // To track last sent delta

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate('/login');
  };

  const shareWithUser = async (email) => {
    const docRef = doc(db, 'docs', docId);
    try {
      await setDoc(docRef, { sharedWith: [email] }, { merge: true });
      alert(`Document shared with ${email}`);
      setShareEmail('');
    } catch (error) {
      console.error("Share mein lafda: ", error);
      alert("Sharing mein dikkat hui");
    }
  };

  const toggleLinkAccess = async () => {
    const docRef = doc(db, 'docs', docId);
    try {
      await setDoc(docRef, { allowLinkAccess: !allowLinkAccess }, { merge: true });
      setAllowLinkAccess(!allowLinkAccess);
      alert(`Link access ${!allowLinkAccess ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Link access toggle mein lafda: ", error);
      alert("Link access toggle mein dikkat hui");
    }
  };

  const sendChanges = useRef(
    _.debounce((docId, delta) => {
      const deltaString = JSON.stringify(delta);
      if (lastSentDelta.current === deltaString) {
        console.log("Duplicate delta, skipping send:", deltaString);
        return;
      }
      lastSentDelta.current = deltaString;
      console.log("Sending changes:", deltaString);
      socket.emit('send-changes', { docId, delta });
    }, 500, { leading: false, trailing: true })
  ).current;

  useEffect(() => {
    if (!editorRef.current || !user) {
      navigate('/login');
      return;
    }

    const checkAccess = async () => {
      const docRef = doc(db, 'docs', docId);
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setAccessDenied(true);
          return;
        }
        const data = docSnap.data();
        const isOwner = data.ownerId === user.uid;
        setIsOwner(isOwner);
        const isShared = data.sharedWith && data.sharedWith.includes(user.email);
        const isLinkAccessible = data.allowLinkAccess === true;
        setAllowLinkAccess(data.allowLinkAccess || false);
        setDocName(data.name || 'Untitled Document');

        if (!isOwner && !isShared && !isLinkAccessible) {
          setAccessDenied(true);
          return;
        }
        setAccessDenied(false);

        quillRef.current = new Quill(editorRef.current, {
          theme: 'snow',
          modules: { toolbar: true },
        });

        if (socket.connected) {
          socket.emit('join-doc', docId);
          console.log("Emitted join-doc for:", docId);
        } else {
          console.log("Socket not connected, waiting for connection...");
        }

        socket.on('joined', (message) => {
          console.log("Socket joined confirmation:", message);
        });

        const content = data.content;
        const delta = content ? JSON.parse(content) : '';
        if (quillRef.current) {
          quillRef.current.setContents(delta || '');
        } else {
          console.error("Quill not initialized yet");
          return;
        }

        quillRef.current.on('text-change', (delta, oldDelta, source) => {
          if (source !== 'user') {
            console.log("Ignoring non-user change:", source);
            return;
          }
          console.log("Text changed, sending delta:", JSON.stringify(delta));
          sendChanges(docId, delta);

          const deltaString = JSON.stringify(quillRef.current.getContents());
          setDoc(doc(db, 'docs', docId), { content: deltaString }, { merge: true })
            .catch((error) => console.error("Save mein lafda: ", error));
        });

        socket.on('receive-changes', (delta) => {
          console.log("Received changes:", JSON.stringify(delta));
          if (quillRef.current) {
            const currentContents = quillRef.current.getContents();
            const newContents = currentContents.compose(delta);
            quillRef.current.setContents(newContents, 'api'); // Use setContents instead of updateContents
            console.log("Applied received changes using setContents");
            console.log("Current editor contents:", JSON.stringify(quillRef.current.getContents()));
            // Force UI update
            quillRef.current.blur();
            quillRef.current.focus();
          } else {
            console.error("Quill not ready to apply changes");
          }
        });

        socket.on('connect', () => {
          console.log("Socket connected:", socket.id);
          socket.emit('join-doc', docId);
        });

        socket.on('connect_error', (error) => {
          console.error("Socket connection error:", error);
        });

        socket.on('disconnect', () => {
          console.log("Socket disconnected");
        });
      } catch (error) {
        console.error("Doc fetch mein lafda: ", error.message);
        setAccessDenied(true);
      }
    };
    checkAccess();

    return () => {
      socket.off('receive-changes');
      socket.off('joined');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      sendChanges.cancel();
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
    };
  }, [docId, user, navigate]);

  const shareableLink = `${window.location.origin}/doc/${docId}`;

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don’t have permission to edit this document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100">
      <nav className="bg-indigo-600 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold tracking-tight">DocSync</h1>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-white font-medium hover:underline">
              Home
            </Link>
            <span className="text-white font-medium">{user.displayName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Document: {docName} (ID: {docId})
        </h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Share this link:</label>
          <input
            type="text"
            value={shareableLink}
            readOnly
            className="w-full p-2 border border-gray-300 rounded bg-gray-100 mb-2"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareableLink)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
          >
            Copy Link
          </button>
          {isOwner && (
            <button
              onClick={toggleLinkAccess}
              className={`${
                allowLinkAccess ? 'bg-yellow-500' : 'bg-gray-500'
              } text-white px-4 py-2 rounded hover:bg-opacity-80`}
            >
              {allowLinkAccess ? 'Disable Link Access' : 'Enable Link Access'}
            </button>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Share with (email):</label>
          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="Enter email to share"
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <button
            onClick={() => shareWithUser(shareEmail)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Share
          </button>
        </div>
        <div
          ref={editorRef}
          className="h-[500px] border border-gray-200 rounded-lg bg-gray-50"
        />
      </div>
    </div>
  );
};

export default Editor;