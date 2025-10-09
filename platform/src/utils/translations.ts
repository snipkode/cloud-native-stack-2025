export type Language = 'en' | 'id';

export interface TranslationKeys {
  // General
  dashboard: string;
  deployments: string;
  billing: string;
  admin: string;
  access: string;
  profile: string;
  settings: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  view: string;
  close: string;
  loading: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  
  // Deployments Tab
  deploymentsTitle: string;
  deploymentsDescription: string;
  noDeploymentsYet: string;
  getStartedByCreatingFirstDeployment: string;
  createDeployment: string;
  newDeployment: string;
  cost: string;
  viewLogs: string;
  restart: string;
  stop: string;
  deleteDeployment: string;
  areYouSureDeleteDeployment: string;
  
  // Deployment Statuses
  statusDeployed: string;
  statusFailed: string;
  statusBuilding: string;
  statusDeploying: string;
  statusStopped: string;
  
  // Billing Tab
  billingTitle: string;
  billingDescription: string;
  addCredits: string;
  availableCredits: string;
  yourPlan: string;
  noPlanSelected: string;
  subscribeToPlan: string;
  availablePlans: string;
  currentPlan: string;
  transactionHistory: string;
  noTransactionsYet: string;
  topUp: string;
  subscription: string;
  
  // Transaction Types
  transactionTopup: string;
  transactionSubscription: string;
  
  // Transaction Statuses
  statusCompleted: string;
  transactionStatusFailed: string;
  statusCancelled: string;
  statusPending: string;
  
  // Common
  amount: string;
  amountIdr: string;
  minimumAmount: string;
  paymentMethod: string;
  paymentMethods: {
    midtrans: string;
    card: string;
    paypal: string;
    crypto: string;
  };
  currency: string;
  language: string;
  toggleLanguage: string;
  
  // Plan features
  apps: string;
  storage: string;
  ram: string;
  cpu: string;
  
  // Admin Tab
  adminPanel: string;
  manageUsersDeploymentsTransactions: string;
  totalUsers: string;
  totalDeployments: string;
  totalTransactions: string;
  activeDeployments: string;
  usersTab: string;
  deploymentsTab: string;
  transactionsTab: string;
  rolesTab: string;
  
  // Access Control Tab
  accessControl: string;
  manageFineGrainedAccessPermissions: string;
  grantAccess: string;
  noAccessGrantsYet: string;
  createGranularAccessPermissions: string;
  resource: string;
  permissions: string;
  expires: string;
  granted: string;
  user: string;
  selectUser: string;
  resourceType: string;
  deploymentResource: string;
  billingResource: string;
  userResource: string;
  systemResource: string;
  resourceIdOptional: string;
  specificResourceId: string;
  permissionsCommaSeparated: string;
  examplePermissions: string;
  expiresAtOptional: string;
  areYouSureRevokeAccess: string;
  
  // Profile Tab
  profileSettings: string;
  profileManageAccountInformation: string;
  profileYourName: string;
  profileOnline: string;
  profileAway: string;
  profileOffline: string;
  profileEdit: string;
  profileSave: string;
  profileSaving: string;
  profileCancel: string;
  profileEmail: string;
  profileMemberSince: string;
  profileLastActivity: string;
  profileUserId: string;
  profileAdmin: string;
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    // General
    dashboard: 'Dashboard',
    deployments: 'Deployments',
    billing: 'Billing',
    admin: 'Admin',
    access: 'Access Control',
    profile: 'Profile',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    loading: 'Loading',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    
    // Deployments Tab
    deploymentsTitle: 'Deployments',
    deploymentsDescription: 'Manage your application deployments',
    noDeploymentsYet: 'No deployments yet',
    getStartedByCreatingFirstDeployment: 'Get started by creating your first deployment',
    createDeployment: 'Create Deployment',
    newDeployment: 'New Deployment',
    cost: 'Cost',
    viewLogs: 'View Logs',
    restart: 'Restart',
    stop: 'Stop',
    deleteDeployment: 'Delete Deployment',
    areYouSureDeleteDeployment: 'Are you sure you want to delete this deployment?',
    
    // Deployment Statuses
    statusDeployed: 'Deployed',
    statusFailed: 'Failed',
    statusBuilding: 'Building',
    statusDeploying: 'Deploying',
    statusStopped: 'Stopped',
    
    // Billing Tab
    billingTitle: 'Billing',
    billingDescription: 'Manage your credits and transactions',
    addCredits: 'Add Credits',
    availableCredits: 'Available Credits',
    yourPlan: 'Your Plan',
    noPlanSelected: 'No Plan Selected',
    subscribeToPlan: 'Subscribe to Plan',
    availablePlans: 'Available Plans',
    currentPlan: 'Current Plan',
    transactionHistory: 'Transaction History',
    noTransactionsYet: 'No transactions yet',
    topUp: 'Top Up',
    subscription: 'Subscription',
    
    // Transaction Types
    transactionTopup: 'Top Up',
    transactionSubscription: 'Subscription',
    
    // Transaction Statuses
    statusCompleted: 'Completed',
    transactionStatusFailed: 'Failed',
    statusCancelled: 'Cancelled',
    statusPending: 'Pending',
    
    // Common
    amount: 'Amount',
    amountIdr: 'Amount (IDR)',
    minimumAmount: 'Minimum amount: IDR 1,000',
    paymentMethod: 'Payment Method',
    paymentMethods: {
      midtrans: 'Midtrans (Credit Card, Bank Transfer, e-Wallet)',
      card: 'Credit Card',
      paypal: 'PayPal',
      crypto: 'Cryptocurrency',
    },
    currency: 'Currency',
    language: 'Language',
    toggleLanguage: 'Toggle Language',
    
    // Plan features
    apps: 'Apps',
    storage: 'Storage',
    ram: 'RAM',
    cpu: 'CPU',
    
    // Admin Tab
    adminPanel: 'Admin Panel',
    manageUsersDeploymentsTransactions: 'Manage users, deployments, and transactions',
    totalUsers: 'Total Users',
    totalDeployments: 'Total Deployments',
    totalTransactions: 'Total Transactions',
    activeDeployments: 'Active Deployments',
    usersTab: 'Users',
    deploymentsTab: 'Deployments',
    transactionsTab: 'Transactions',
    rolesTab: 'Roles',
    
    // Access Control Tab
    accessControl: 'Access Control',
    manageFineGrainedAccessPermissions: 'Manage fine-grained access permissions',
    grantAccess: 'Grant Access',
    noAccessGrantsYet: 'No access grants yet',
    createGranularAccessPermissions: 'Create granular access permissions for users',
    resource: 'Resource',
    permissions: 'Permissions',
    expires: 'Expires',
    granted: 'Granted',
    user: 'User',
    selectUser: 'Select a user',
    resourceType: 'Resource Type',
    deploymentResource: 'Deployment',
    billingResource: 'Billing',
    userResource: 'User',
    systemResource: 'System',
    resourceIdOptional: 'Resource ID (optional)',
    specificResourceId: 'Specific resource ID',
    permissionsCommaSeparated: 'Permissions (comma-separated)',
    examplePermissions: 'read, write, delete',
    expiresAtOptional: 'Expires At (optional)',
    areYouSureRevokeAccess: 'Are you sure you want to revoke this access grant?',
    
    // Profile Tab
    profileSettings: 'Profile Settings',
    profileManageAccountInformation: 'Manage your account information',
    profileYourName: 'Your name',
    profileOnline: 'Online',
    profileAway: 'Away',
    profileOffline: 'Offline',
    profileEdit: 'Edit Profile',
    profileSave: 'Save',
    profileSaving: 'Saving...',
    profileCancel: 'Cancel',
    profileEmail: 'Email',
    profileMemberSince: 'Member Since',
    profileLastActivity: 'Last Activity',
    profileUserId: 'User ID',
    profileAdmin: 'Admin',
  },
  
  id: {
    // General
    dashboard: 'Dasbor',
    deployments: 'Deployment',
    billing: 'Tagihan',
    admin: 'Admin',
    access: 'Kontrol Akses',
    profile: 'Profil',
    settings: 'Pengaturan',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    view: 'Lihat',
    close: 'Tutup',
    loading: 'Memuat',
    error: 'Galat',
    success: 'Berhasil',
    warning: 'Peringatan',
    info: 'Info',
    
    // Deployments Tab
    deploymentsTitle: 'Deployment',
    deploymentsDescription: 'Kelola deployment aplikasi Anda',
    noDeploymentsYet: 'Belum ada deployment',
    getStartedByCreatingFirstDeployment: 'Mulai dengan membuat deployment pertama Anda',
    createDeployment: 'Buat Deployment',
    newDeployment: 'Deployment Baru',
    cost: 'Biaya',
    viewLogs: 'Lihat Log',
    restart: 'Mulai Ulang',
    stop: 'Berhenti',
    deleteDeployment: 'Hapus Deployment',
    areYouSureDeleteDeployment: 'Apakah Anda yakin ingin menghapus deployment ini?',
    
    // Deployment Statuses
    statusDeployed: 'Telah Di-deploy',
    statusFailed: 'Gagal',
    statusBuilding: 'Sedang Dibangun',
    statusDeploying: 'Sedang Deploy',
    statusStopped: 'Berhenti',
    
    // Billing Tab
    billingTitle: 'Tagihan',
    billingDescription: 'Kelola kredit dan transaksi Anda',
    addCredits: 'Tambah Kredit',
    availableCredits: 'Kredit Tersedia',
    yourPlan: 'Paket Anda',
    noPlanSelected: 'Tidak Ada Paket Dipilih',
    subscribeToPlan: 'Berlangganan Paket',
    availablePlans: 'Paket Tersedia',
    currentPlan: 'Paket Saat Ini',
    transactionHistory: 'Riwayat Transaksi',
    noTransactionsYet: 'Belum ada transaksi',
    topUp: 'Isi Ulang',
    subscription: 'Langganan',
    
    // Transaction Types
    transactionTopup: 'Isi Ulang',
    transactionSubscription: 'Langganan',
    
    // Transaction Statuses
    statusCompleted: 'Selesai',
    transactionStatusFailed: 'Gagal',
    statusCancelled: 'Dibatalkan',
    statusPending: 'Tertunda',
    
    // Common
    amount: 'Jumlah',
    amountIdr: 'Jumlah (IDR)',
    minimumAmount: 'Jumlah minimum: IDR 1.000',
    paymentMethod: 'Metode Pembayaran',
    paymentMethods: {
      midtrans: 'Midtrans (Kartu Kredit, Transfer Bank, e-Wallet)',
      card: 'Kartu Kredit',
      paypal: 'PayPal',
      crypto: 'Mata Uang Kripto',
    },
    currency: 'Mata Uang',
    language: 'Bahasa',
    toggleLanguage: 'Ubah Bahasa',
    
    // Plan features
    apps: 'Aplikasi',
    storage: 'Penyimpanan',
    ram: 'RAM',
    cpu: 'CPU',
    
    // Admin Tab
    adminPanel: 'Panel Admin',
    manageUsersDeploymentsTransactions: 'Kelola pengguna, deployment, dan transaksi',
    totalUsers: 'Total Pengguna',
    totalDeployments: 'Total Deployment',
    totalTransactions: 'Total Transaksi',
    activeDeployments: 'Deployment Aktif',
    usersTab: 'Pengguna',
    deploymentsTab: 'Deployment',
    transactionsTab: 'Transaksi',
    rolesTab: 'Peran',
    
    // Access Control Tab
    accessControl: 'Kontrol Akses',
    manageFineGrainedAccessPermissions: 'Kelola izin akses terperinci',
    grantAccess: 'Berikan Akses',
    noAccessGrantsYet: 'Belum ada akses diberikan',
    createGranularAccessPermissions: 'Buat izin akses terperinci untuk pengguna',
    resource: 'Sumber Daya',
    permissions: 'Izin',
    expires: 'Kedaluwarsa',
    granted: 'Diberikan',
    user: 'Pengguna',
    selectUser: 'Pilih pengguna',
    resourceType: 'Tipe Sumber Daya',
    deploymentResource: 'Deployment',
    billingResource: 'Tagihan',
    userResource: 'Pengguna',
    systemResource: 'Sistem',
    resourceIdOptional: 'ID Sumber Daya (opsional)',
    specificResourceId: 'ID sumber daya spesifik',
    permissionsCommaSeparated: 'Izin (dipisahkan koma)',
    examplePermissions: 'baca, tulis, hapus',
    expiresAtOptional: 'Tanggal Kedaluwarsa (opsional)',
    areYouSureRevokeAccess: 'Apakah Anda yakin ingin mencabut akses ini?',
    
    // Profile Tab
    profileSettings: 'Pengaturan Profil',
    profileManageAccountInformation: 'Kelola informasi akun Anda',
    profileYourName: 'Nama Anda',
    profileOnline: 'Online',
    profileAway: 'Pergi',
    profileOffline: 'Offline',
    profileEdit: 'Edit Profil',
    profileSave: 'Simpan',
    profileSaving: 'Menyimpan...',
    profileCancel: 'Batal',
    profileEmail: 'Email',
    profileMemberSince: 'Anggota Sejak',
    profileLastActivity: 'Aktivitas Terakhir',
    profileUserId: 'ID Pengguna',
    profileAdmin: 'Admin',
  },
};

// Helper function to get translation
export const t = <K extends keyof TranslationKeys>(
  key: K,
  lang: Language = 'en'
): TranslationKeys[K] => {
  return translations[lang][key];
};

// Alternative helper function
export const getTranslation = <K extends keyof TranslationKeys>(
  key: K,
  lang: Language = 'en'
): TranslationKeys[K] => {
  return translations[lang][key];
};

// Helper function to get nested translation values (e.g., 'paymentMethods.midtrans')
export const getNestedTranslation = (
  obj: Record<Language, TranslationKeys>,
  path: string,
  lang: Language
): string => {
  const keys = path.split('.');
  let result: unknown = obj[lang];

  for (const key of keys) {
    if (result && typeof result === 'object') {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof result === 'string' ? result : path;
};