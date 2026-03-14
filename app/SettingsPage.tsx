"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building2,
  Package,
  Bell,
  Palette,
  Shield,
  Camera,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Plus,
  X,
  Check,
  AlertTriangle,
  LogOut,
  Smartphone,
  Save,
} from "lucide-react";

// Toggle Switch Component
function ToggleSwitch({ 
  enabled, 
  onChange,
  color = "blue" 
}: { 
  enabled: boolean; 
  onChange: (value: boolean) => void;
  color?: "blue" | "purple" | "indigo" | "green";
}) {
  const colors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
    green: "bg-emerald-500",
  };

  return (
    <motion.button
      onClick={() => onChange(!enabled)}
      className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 ${
        enabled ? colors[color] : "bg-zinc-700"
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-5 h-5 rounded-full shadow-md settings-toggle-thumb"
        animate={{ x: enabled ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

// Section Card Component
function SettingsSection({ 
  title, 
  icon: Icon, 
  children,
  delay = 0 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden settings-card"
    >
      <div className="absolute inset-0 settings-card-overlay" />
      <div className="relative p-6 settings-card-content">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600/80 to-cyan-500/80 border border-transparent shadow-xl">
            <Icon size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

// Input Field Component
function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-600">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
        )}
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-11" : "pl-4"} ${isPassword ? "pr-11" : "pr-4"} py-3 rounded-xl settings-input transition-all duration-300 text-[var(--text-primary)] placeholder-slate-400`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

// Color Picker Component
function ColorPicker({
  selectedColor,
  onChange,
}: {
  selectedColor: string;
  onChange: (color: string) => void;
}) {
  const colors = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Green", value: "#10b981" },
    { name: "Orange", value: "#f59e0b" },
    { name: "Pink", value: "#ec4899" },
    { name: "Red", value: "#ef4444" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <motion.button
          key={color.value}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(color.value)}
          className={`relative w-10 h-10 rounded-xl transition-all duration-300 ${
            selectedColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
          }`}
          style={{ backgroundColor: color.value }}
        >
          {selectedColor === color.value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check size={16} className="text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// Category Tag Component
function CategoryTag({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 px-3 py-1.5 settings-category-tag rounded-lg text-sm"
    >
      <span>{name}</span>
      <button
        onClick={onRemove}
        className="hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// Notification Item Component
function NotificationItem({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--glass-border)] last:border-0 settings-notification">
      <div>
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Profile Settings State
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@coreinventory.io",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Company Settings State
  const [company, setCompany] = useState({
    name: "CoreInventory Inc.",
    address: "123 Warehouse Street, Tech City, TC 12345",
    email: "contact@coreinventory.io",
    phone: "+1 (555) 123-4567",
  });

  // Inventory Settings State
  const [inventory, setInventory] = useState({
    lowStockThreshold: "10",
    defaultWarehouse: "main",
    categories: ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"],
  });
  const [newCategory, setNewCategory] = useState("");

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    lowStockAlerts: true,
    emailNotifications: true,
    orderUpdates: true,
    systemAlerts: false,
    weeklyReports: true,
    securityAlerts: true,
  });

  // Appearance Settings State
  const [appearance, setAppearance] = useState({
    darkMode: true,
    themeColor: "#3b82f6",
  });

  // Security Settings State
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
  });

  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    profile: {
      name: "Admin User",
      email: "admin@coreinventory.io",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    company: {
      name: "CoreInventory Inc.",
      address: "123 Warehouse Street, Tech City, TC 12345",
      email: "contact@coreinventory.io",
      phone: "+1 (555) 123-4567",
    },
    inventory: {
      lowStockThreshold: "10",
      defaultWarehouse: "main",
      categories: ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"],
    },
    notifications: {
      lowStockAlerts: true,
      emailNotifications: true,
      orderUpdates: true,
      systemAlerts: false,
      weeklyReports: true,
      securityAlerts: true,
    },
    appearance: {
      darkMode: true,
      themeColor: "#3b82f6",
    },
    security: {
      twoFactorAuth: false,
    },
  }));

  const currentSettings = useMemo(
    () => ({
      profile,
      company,
      inventory,
      notifications,
      appearance,
      security,
    }),
    [profile, company, inventory, notifications, appearance, security]
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(currentSettings) !== JSON.stringify(savedSnapshot),
    [currentSettings, savedSnapshot]
  );

  const passwordStrength = useMemo(() => {
    const password = profile.newPassword;
    if (!password) {
      return { width: "0%", label: "", color: "bg-slate-300" };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { width: "25%", label: "Weak", color: "bg-red-500" };
    if (score === 2) return { width: "50%", label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { width: "75%", label: "Good", color: "bg-blue-500" };

    return { width: "100%", label: "Strong", color: "bg-emerald-500" };
  }, [profile.newPassword]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !inventory.categories.includes(newCategory.trim())) {
      setInventory({
        ...inventory,
        categories: [...inventory.categories, newCategory.trim()],
      });
      setNewCategory("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    setInventory({
      ...inventory,
      categories: inventory.categories.filter((c) => c !== category),
    });
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveMessage(null);

    if (!profile.email.includes("@")) {
      setSaveError("Please enter a valid email address.");
      return;
    }

    if (profile.newPassword || profile.confirmPassword || profile.currentPassword) {
      if (profile.newPassword.length < 8) {
        setSaveError("New password must be at least 8 characters long.");
        return;
      }

      if (profile.newPassword !== profile.confirmPassword) {
        setSaveError("New password and confirmation do not match.");
        return;
      }
    }

    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSaving(false);
    setSaveMessage("Settings saved successfully.");
    setLastSavedAt(new Date());

    setProfile((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));

    setSavedSnapshot({
      ...currentSettings,
      profile: {
        ...currentSettings.profile,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });
  };

  const handleResetActiveTab = () => {
    const defaults = savedSnapshot;

    if (activeTab === "profile") {
      setProfile(defaults.profile);
    }
    if (activeTab === "company") {
      setCompany(defaults.company);
    }
    if (activeTab === "inventory") {
      setInventory(defaults.inventory);
      setNewCategory("");
    }
    if (activeTab === "notifications") {
      setNotifications(defaults.notifications);
    }
    if (activeTab === "appearance") {
      setAppearance(defaults.appearance);
    }
    if (activeTab === "security") {
      setSecurity(defaults.security);
    }

    setSaveError(null);
    setSaveMessage("Active tab reset to last saved values.");
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "company", name: "Company", icon: Building2 },
    { id: "inventory", name: "Inventory", icon: Package },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "security", name: "Security", icon: Shield },
  ];

  return (
    <>
      <main className="p-8 settings-shell">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-[var(--text-primary)]">Settings</span>
              </h1>
              <p className="text-[var(--text-secondary)]">
                Manage your account and application preferences
              </p>
              {lastSavedAt && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Last saved at {lastSavedAt.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
               <button
                 type="button"
                 onClick={handleResetActiveTab}
                 className="px-4 py-3 settings-reset-btn rounded-xl transition-colors"
               >
                 Reset Tab
               </button>
               <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
                 className="flex items-center gap-2 px-6 py-3 settings-save-btn rounded-xl font-medium shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Save size={20} />
                )}
                {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}
              </motion.button>
            </div>
          </motion.div>

          {(saveMessage || saveError || hasUnsavedChanges) && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                saveError
                  ? "bg-red-50 text-red-700 border-red-200"
                  : saveMessage
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {saveError || saveMessage || "You have unsaved changes in this page."}
            </div>
          )}

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id ? "settings-tab-active" : "settings-tab-inactive"
                }`}
              >
                <tab.icon size={18} />
                {tab.name}
              </motion.button>
            ))}
          </motion.div>

          {/* Settings Content */}
          <AnimatePresence mode="wait">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <SettingsSection title="Profile Information" icon={User}>
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px]">
                      <div className="w-full h-full rounded-2xl bg-[var(--settings-card-bg-strong)] flex items-center justify-center border border-[var(--settings-card-border)]">
                          <User size={40} className="text-[var(--text-secondary)]" />
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-xl text-white shadow-lg"
                      >
                        <Camera size={16} />
                      </motion.button>
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{profile.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{profile.email}</p>
                      <button className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        Change profile picture
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      value={profile.name}
                      onChange={(value) => setProfile({ ...profile, name: value })}
                      placeholder="Enter your name"
                      icon={User}
                    />
                    <InputField
                      label="Email Address"
                      type="email"
                      value={profile.email}
                      onChange={(value) => setProfile({ ...profile, email: value })}
                      placeholder="Enter your email"
                      icon={Mail}
                    />
                  </div>
                </SettingsSection>

                <SettingsSection title="Change Password" icon={Lock} delay={0.1}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      label="Current Password"
                      type="password"
                      value={profile.currentPassword}
                      onChange={(value) => setProfile({ ...profile, currentPassword: value })}
                      placeholder="••••••••"
                      icon={Lock}
                    />
                    <InputField
                      label="New Password"
                      type="password"
                      value={profile.newPassword}
                      onChange={(value) => setProfile({ ...profile, newPassword: value })}
                      placeholder="••••••••"
                      icon={Lock}
                    />
                    <InputField
                      label="Confirm Password"
                      type="password"
                      value={profile.confirmPassword}
                      onChange={(value) => setProfile({ ...profile, confirmPassword: value })}
                      placeholder="••••••••"
                      icon={Lock}
                    />
                  </div>

                  {profile.newPassword && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-600">Password strength</p>
                        <span className="text-sm font-medium text-slate-700">{passwordStrength.label}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                    </div>
                  )}
                </SettingsSection>
              </motion.div>
            )}

            {/* Company Settings */}
            {activeTab === "company" && (
              <motion.div
                key="company"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SettingsSection title="Company Information" icon={Building2}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Company Name"
                      value={company.name}
                      onChange={(value) => setCompany({ ...company, name: value })}
                      placeholder="Enter company name"
                      icon={Building2}
                    />
                    <InputField
                      label="Contact Email"
                      type="email"
                      value={company.email}
                      onChange={(value) => setCompany({ ...company, email: value })}
                      placeholder="Enter contact email"
                      icon={Mail}
                    />
                    <InputField
                      label="Phone Number"
                      value={company.phone}
                      onChange={(value) => setCompany({ ...company, phone: value })}
                      placeholder="Enter phone number"
                      icon={Phone}
                    />
                    <div className="md:col-span-2">
                      <InputField
                        label="Warehouse Address"
                        value={company.address}
                        onChange={(value) => setCompany({ ...company, address: value })}
                        placeholder="Enter warehouse address"
                        icon={MapPin}
                      />
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* Inventory Settings */}
            {activeTab === "inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <SettingsSection title="Inventory Configuration" icon={Package}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-zinc-400">
                        Low Stock Threshold
                      </label>
                      <div className="relative">
                        <AlertTriangle
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                          type="number"
                          value={inventory.lowStockThreshold}
                          onChange={(e) =>
                            setInventory({ ...inventory, lowStockThreshold: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 settings-input outline-none transition-all duration-300 text-[var(--text-primary)]"
                        />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Items below this quantity will trigger low stock alerts
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-600">
                        Default Warehouse
                      </label>
                      <select
                        value={inventory.defaultWarehouse}
                        onChange={(e) =>
                          setInventory({ ...inventory, defaultWarehouse: e.target.value })
                        }
                        className="w-full px-4 py-3 settings-input outline-none transition-all duration-300 text-[var(--text-primary)]"
                      >
                        <option value="main">Main Warehouse</option>
                        <option value="secondary">Secondary Warehouse</option>
                        <option value="distribution">Distribution Center</option>
                      </select>
                    </div>
                  </div>
                </SettingsSection>

                <SettingsSection title="Product Categories" icon={Package} delay={0.1}>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                        placeholder="Add new category..."
                        className="flex-1 px-4 py-3 settings-input outline-none transition-all duration-300 text-[var(--text-primary)] placeholder-slate-400"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddCategory}
                        className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={20} />
                      </motion.button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {inventory.categories.map((category) => (
                          <CategoryTag
                            key={category}
                            name={category}
                            onRemove={() => handleRemoveCategory(category)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SettingsSection title="Notification Preferences" icon={Bell}>
                  <NotificationItem
                    title="Low Stock Alerts"
                    description="Get notified when products fall below the stock threshold"
                    enabled={notifications.lowStockAlerts}
                    onChange={(value) => setNotifications({ ...notifications, lowStockAlerts: value })}
                  />
                  <NotificationItem
                    title="Email Notifications"
                    description="Receive important updates via email"
                    enabled={notifications.emailNotifications}
                    onChange={(value) => setNotifications({ ...notifications, emailNotifications: value })}
                  />
                  <NotificationItem
                    title="Order Updates"
                    description="Get notified about new orders and order status changes"
                    enabled={notifications.orderUpdates}
                    onChange={(value) => setNotifications({ ...notifications, orderUpdates: value })}
                  />
                  <NotificationItem
                    title="System Alerts"
                    description="Receive alerts about system maintenance and updates"
                    enabled={notifications.systemAlerts}
                    onChange={(value) => setNotifications({ ...notifications, systemAlerts: value })}
                  />
                  <NotificationItem
                    title="Weekly Reports"
                    description="Receive weekly inventory and sales reports"
                    enabled={notifications.weeklyReports}
                    onChange={(value) => setNotifications({ ...notifications, weeklyReports: value })}
                  />
                  <NotificationItem
                    title="Security Alerts"
                    description="Get notified about security-related events"
                    enabled={notifications.securityAlerts}
                    onChange={(value) => setNotifications({ ...notifications, securityAlerts: value })}
                  />
                </SettingsSection>
              </motion.div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <SettingsSection title="Theme Settings" icon={Palette}>
                  <div className="flex items-center justify-between py-4 border-b border-[var(--glass-border)]">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Dark Mode</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Use dark theme for the dashboard
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={appearance.darkMode}
                      onChange={(value) => setAppearance({ ...appearance, darkMode: value })}
                      color="purple"
                    />
                  </div>

                  <div className="py-4">
                    <p className="font-medium text-[var(--text-primary)] mb-2">Accent Color</p>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Choose your preferred accent color for the interface
                    </p>
                    <ColorPicker
                      selectedColor={appearance.themeColor}
                      onChange={(color) => setAppearance({ ...appearance, themeColor: color })}
                    />
                  </div>
                </SettingsSection>

                <SettingsSection title="Preview" icon={Palette} delay={0.1}>
                  <div className="p-4 rounded-xl bg-[var(--settings-card-bg-strong)] border border-[var(--settings-card-border)]">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl"
                        style={{ backgroundColor: appearance.themeColor }}
                      />
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">Sample Card</p>
                        <p className="text-sm text-[var(--text-secondary)]">With your selected theme color</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: appearance.themeColor }}
                      >
                        Primary Button
                      </motion.button>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium border"
                        style={{ borderColor: appearance.themeColor, color: appearance.themeColor }}
                      >
                        Secondary Button
                      </button>
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <SettingsSection title="Two-Factor Authentication" icon={Smartphone}>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Enable 2FA</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={security.twoFactorAuth}
                      onChange={(value) => setSecurity({ ...security, twoFactorAuth: value })}
                      color="green"
                    />
                  </div>

                  {security.twoFactorAuth && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <Check className="text-emerald-400" size={20} />
                        <div>
                          <p className="font-medium text-emerald-400">2FA Enabled</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Your account is protected with two-factor authentication
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </SettingsSection>

                <SettingsSection title="Session Management" icon={Shield} delay={0.1}>
                  <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[var(--settings-card-bg-strong)] border border-[var(--settings-card-border)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Smartphone size={18} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">Current Session</p>
                            <p className="text-sm text-[var(--text-secondary)]">Windows • Chrome • Active now</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Current
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut size={18} />
                      Sign out from all devices
                    </motion.button>
                  </div>
                </SettingsSection>

                <SettingsSection title="Danger Zone" icon={AlertTriangle} delay={0.2}>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h4 className="font-medium text-red-400 mb-2">Delete Account</h4>
                    <p className="text-sm text-zinc-400 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Delete Account
                    </motion.button>
                  </div>
                </SettingsSection>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
    </>
  );
}
