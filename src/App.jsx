import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Seminars from './pages/Seminars';
import SeminarRegistration from './pages/SeminarRegistration';
import ActivityDashboard from './pages/ActivityDashboard';
import PostSeminar from './pages/PostSeminar';
import MyActivities from './pages/MyActivities';
import TrainerProfiles from './pages/TrainerProfiles';
import TrainerDetails from './pages/TrainerDetails';
import CreateChoice from './pages/CreateChoice';
import PostCollection from './pages/PostCollection';
import Sources from './pages/Sources';
import MyCollections from './pages/MyCollections';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import AdminVerification from './pages/AdminVerification';
import AdminUsers from './pages/AdminUsers';
import { UserRoleProvider } from './context/UserRoleContext';
import { SeminarProvider } from './context/SeminarContext';
import { TrainerProvider } from './context/TrainerContext';

function App() {
  return (
    <UserRoleProvider>
      <SeminarProvider>
        <TrainerProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/seminars" element={<Seminars />} />
              <Route path="/explore" element={<Seminars />} />
              <Route path="/search" element={<Navigate to="/explore" replace />} />
              <Route path="/register/:id" element={<SeminarRegistration />} />
              <Route path="/dashboard" element={<ActivityDashboard />} />
              <Route path="/activity-dashboard" element={<ActivityDashboard />} />
              <Route path="/post-seminar" element={<PostSeminar />} />
              <Route path="/create" element={<CreateChoice />} />
              <Route path="/post-collection" element={<PostCollection />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/collection" element={<Sources />} />
              <Route path="/my-collections" element={<MyCollections />} />
              <Route path="/my-activities" element={<MyActivities />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/profile/:uid" element={<UserProfile />} />
              <Route path="/users" element={<Users />} />
              <Route path="/admin/verification" element={<AdminVerification />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/manage-admins" element={<AdminUsers manageAdmins />} />
              <Route path="/trainers" element={<TrainerProfiles />} />
              <Route path="/trainers/:id" element={<TrainerDetails />} />
            </Routes>
          </Router>
        </TrainerProvider>
      </SeminarProvider>
    </UserRoleProvider>
  );
}

export default App;
