import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, LogOut, Save, Eye, EyeOff, Check } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import AvatarUpload from "../components/profile/AvatarUpload";
import { categories } from "../constants/categories";
import { useAuth } from "../context/AuthContext";

const MAX_INTERESTS = 4;

export default function Settings() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  // ---- Profile section state ----
  const [name, setName] = useState(user?.name || "");
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type: 'success'|'error', text }

  useEffect(() => {  
    setName(user?.name || "");
    setSelectedInterests(user?.interests || []);
  }, [user]);

  const profileChanged =
    name.trim() !== (user?.name || "") ||
    JSON.stringify([...selectedInterests].sort()) !== JSON.stringify([...(user?.interests || [])].sort());

  const toggleInterest = (value) => {
    setSelectedInterests((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= MAX_INTERESTS) return prev; // silently ignore past the cap
      return [...prev, value];
    });
  };

  const handleAvatarUploaded = async (url) => {
    try {
      await updateProfile({ avatar: url });
    } catch (err) {
      // could add a toast here later
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setProfileMsg({ type: "error", text: "Name cannot be empty" });
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({ name: cleanName, interests: selectedInterests });
      setProfileMsg({ type: "success", text: "Profile updated" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.msg || "Could not update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  // ---- Password section state ----
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "Please fill in all password fields" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "New password and confirmation don't match" });
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.msg || "Could not change password" });
    } finally {
      setPwSaving(false);
    }
  };

  // ---- Notification toggle state ----
  const [notifSaving, setNotifSaving] = useState(false);
  const notificationsEnabled = user?.notificationsEnabled !== false; // default true if undefined

  const handleToggleNotifications = async () => {
    setNotifSaving(true);
    try {
      await updateProfile({ notificationsEnabled: !notificationsEnabled });
    } catch (err) {
      // could add a toast here later
    } finally {
      setNotifSaving(false);
    }
  };

  // ---- Logout ----
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-bgLight">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <h1 className="text-lg font-medium text-textDark mb-1">Settings</h1>
        <p className="text-xs text-textMuted mb-6">Manage your profile, password, and notifications.</p>

        {/* ---- Update Profile ---- */}
        <div className="bg-white border border-borderClr rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium text-textDark mb-4">Update profile</h2>

          <div className="flex items-center gap-4 mb-5">
            <AvatarUpload
              avatarUrl={user?.avatar}
              name={user?.name}
              size={64}
              onUploaded={handleAvatarUploaded}
              onClickImage={() => {}}
            />
            <p className="text-[11px] text-textMuted">
              Click the camera icon to change your profile picture.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-textMuted mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                placeholder="Your name"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-textMuted block">Interests</label>
                <span className="text-[11px] text-textMuted">
                  {selectedInterests.length}/{MAX_INTERESTS} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const active = selectedInterests.includes(cat.value);
                  const disabled = !active && selectedInterests.length >= MAX_INTERESTS;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleInterest(cat.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                        active
                          ? "bg-primary text-white border-primary"
                          : disabled
                          ? "text-textMuted/50 border-borderClr cursor-not-allowed"
                          : "text-textDark border-borderClr hover:border-primary/40"
                      }`}
                    >
                      <span>{cat.emoji}</span> {cat.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {profileMsg && (
              <p className={`text-xs ${profileMsg.type === "success" ? "text-success" : "text-danger"}`}>
                {profileMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={!profileChanged || profileSaving}
              className="flex items-center justify-center gap-1.5 bg-primary text-white text-sm py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-fit px-4"
            >
              <Save size={14} />
              {profileSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>

        {/* ---- Reset Password ---- */}
        <div className="bg-white border border-borderClr rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium text-textDark mb-4">Reset password</h2>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-textMuted mb-1 block">Current password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full text-sm border border-borderClr rounded-md px-3 py-2 pr-9 outline-none focus:border-primary"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textDark"
                  aria-label={showPw ? "Hide passwords" : "Show passwords"}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-textMuted mb-1 block">New password</label>
              <input
                type={showPw ? "text" : "password"}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="text-xs text-textMuted mb-1 block">Confirm new password</label>
              <input
                type={showPw ? "text" : "password"}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full text-sm border border-borderClr rounded-md px-3 py-2 outline-none focus:border-primary"
                placeholder="Re-enter new password"
              />
            </div>

            {pwMsg && (
              <p className={`text-xs ${pwMsg.type === "success" ? "text-success" : "text-danger"}`}>
                {pwMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={pwSaving}
              className="flex items-center justify-center gap-1.5 bg-primary text-white text-sm py-2 rounded-md hover:bg-primary/90 disabled:opacity-60 w-fit px-4"
            >
              <Check size={14} />
              {pwSaving ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>

        {/* ---- Notifications ---- */}
        <div className="bg-white border border-borderClr rounded-xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={notificationsEnabled ? "text-primary" : "text-textMuted"}>
              {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <p className="text-sm font-medium text-textDark">Notifications</p>
              <p className="text-[11px] text-textMuted">
                {notificationsEnabled
                  ? "You'll get notified about follows, comments, replies, and new posts."
                  : "You won't receive any new notifications."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleNotifications}
            disabled={notifSaving}
            aria-label="Toggle notifications"
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              notificationsEnabled ? "bg-primary" : "bg-slate-300"
            } disabled:opacity-60`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                notificationsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>


        

        {/* ---- Logout ---- */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-danger text-sm border border-danger/30 rounded-md px-4 py-2 hover:bg-danger/5 w-fit"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>

      <Footer />
    </div>
  );
}