# Panduan Instalasi Mizanly

Dokumen ini berisi panduan untuk melakukan instalasi dan konfigurasi aplikasi Mizanly.

## 1. Persyaratan Sistem
- Node.js (Versi 18 atau terbaru)
- NPM atau PNPM
- Akun Firebase (untuk Database dan Autentikasi)
- MySQL/PostgreSQL (Opsional, jika ingin menggunakan skrip migrasi database relasional)

## 2. Konfigurasi Firebase

Aplikasi ini menggunakan Firebase Firestore sebagai database utama. Pastikan Anda telah membuat projek di Firebase Console dan mengaktifkan **Firestore Database** serta **Firebase Authentication (Google Login)**.

### Firestore Security Rules
Gunakan aturan keamanan berikut untuk Firestore Anda. Aturan ini telah diperbarui untuk mendukung fitur 'Linked Account' dan validasi skema yang ketat.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 0. Default Deny
    match /{document=**} {
      allow read, write: if false;
    }

    // --- Helpers ---
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function hasAccess(userId) {
      return isOwner(userId) || (
        isSignedIn() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('linkedUserId', null) == userId
      );
    }

    function isValidId(id) {
      return id is string && id.size() <= 64 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    // --- Validation Blueprints ---

    function isValidUser(data) {
      return data.keys().hasAll(['uid', 'email', 'displayName', 'appCode']) &&
             data.keys().size() <= 30 &&
             data.uid is string &&
             data.email is string &&
             data.displayName is string && data.displayName.size() <= 100 &&
             data.appCode is string && data.appCode.size() == 6 &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('id' in data) || data.id is string) &&
             (!('monthlyIncome' in data) || (data.monthlyIncome is number && data.monthlyIncome >= 0)) &&
             (!('linkedUserId' in data) || data.linkedUserId == null || (data.linkedUserId is string && data.linkedUserId.size() <= 128)) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidBudgetItem(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['name', 'amount', 'category', 'status', 'deadline', 'ownerId'])) &&
             data.keys().size() <= 30 &&
             (!('name' in data) || (data.name is string && data.name.size() <= 200)) &&
             (!('amount' in data) || data.amount is number) &&
             (!('category' in data) || data.category is string) &&
             (!('status' in data) || data.status in ['Lunas', 'Belum dibayar']) &&
             (!('deadline' in data) || data.deadline is timestamp) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidTransaction(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['title', 'amount', 'category', 'type', 'date', 'notes', 'ownerId'])) &&
             data.keys().size() <= 40 &&
             (!('title' in data) || (data.title is string && data.title.size() <= 250)) &&
             (!('amount' in data) || data.amount is number) &&
             (!('category' in data) || data.category is string) &&
             (!('type' in data) || data.type in ['income', 'expense']) &&
             (!('date' in data) || data.date is timestamp) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('categoryId' in data) || data.categoryId == null || data.categoryId is string) &&
             (!('subCategory' in data) || data.subCategory == null || data.subCategory is string) &&
             (!('walletId' in data) || data.walletId == null || data.walletId is string) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidWallet(data, isUpdate, userId) {
      const basic = (isUpdate || data.keys().hasAll(['name', 'balance', 'type', 'ownerId'])) &&
             data.keys().size() <= 60 &&
             (!('name' in data) || (data.name is string && data.name.size() <= 200)) &&
             (!('balance' in data) || data.balance is number) &&
             (!('type' in data) || data.type in ['debit', 'credit']) &&
             (!('ownerId' in data) || data.ownerId == userId);
      
      if (!basic) return false;
      if (!isUpdate) {
        return (!('walletType' in data) || data.walletType in ['Bank', 'E-Wallet', 'Cash', 'Lainnya']) &&
               (!('limit' in data) || data.limit is number);
      }
      return true;
    }

    function isValidBill(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['name', 'amount', 'dueDate', 'status', 'category', 'ownerId'])) &&
             data.keys().size() <= 30 &&
             (!('name' in data) || (data.name is string && data.name.size() <= 100)) &&
             (!('amount' in data) || data.amount is number) &&
             (!('dueDate' in data) || data.dueDate is timestamp) &&
             (!('status' in data) || data.status in ['paid', 'unpaid']) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidBudget(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['limit', 'period', 'categoryId', 'categoryName', 'ownerId'])) &&
             data.keys().size() <= 30 &&
             (!('limit' in data) || data.limit is number) &&
             (!('period' in data) || data.period in ['Weekly', 'Monthly']) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidCategory(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['name', 'type', 'color', 'icon', 'subCategories', 'ownerId'])) &&
             data.keys().size() <= 30 &&
             (!('name' in data) || (data.name is string && data.name.size() <= 100)) &&
             (!('type' in data) || data.type in ['income', 'expense']) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('commitmentType' in data) || data.commitmentType in ['debt', 'fixed', 'savings', 'regular', 'catatan']) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidBundle(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['name', 'date', 'status', 'items', 'ownerId'])) &&
             data.keys().size() <= 50 &&
             (!('name' in data) || (data.name is string && data.name.size() <= 250)) &&
             (!('status' in data) || data.status in ['active', 'paid']) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('walletId' in data) || data.walletId == null || data.walletId is string) &&
             (!('notes' in data) || data.notes is string) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidDebt(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['personName', 'amount', 'type', 'borrowDate', 'status', 'ownerId'])) &&
             data.keys().size() <= 50 &&
             (!('personName' in data) || (data.personName is string && data.personName.size() <= 150)) &&
             (!('amount' in data) || data.amount is number) &&
             (!('type' in data) || data.type in ['debt', 'receivable']) &&
             (!('status' in data) || data.status in ['active', 'paid']) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('dueDate' in data) || data.dueDate is timestamp) &&
             (!('walletId' in data) || data.walletId is string) &&
             (!('notes' in data) || data.notes is string) &&
             (!('isInstallment' in data) || data.isInstallment is bool) &&
             (!('interestRate' in data) || data.interestRate is number) &&
             (!('tenor' in data) || data.tenor is number) &&
             (!('dueDateDay' in data) || data.dueDateDay is number) &&
             (!('paidAmount' in data) || data.paidAmount is number) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidSimulation(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['loanAmount', 'interestRate', 'ownerId'])) &&
             data.keys().size() <= 20 &&
             (!('loanAmount' in data) || data.loanAmount is number) &&
             (!('interestRate' in data) || data.interestRate is number) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidRecurring(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['title', 'amount', 'frequency', 'startDate', 'ownerId'])) &&
             data.keys().size() <= 40 &&
             (!('title' in data) || (data.title is string && data.title.size() <= 250)) &&
             (!('amount' in data) || data.amount is number) &&
             (!('frequency' in data) || data.frequency in ['Monthly', 'Weekly', 'Daily']) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('endDate' in data) || data.endDate is timestamp || data.endDate == null) &&
             (!('walletId' in data) || data.walletId is string) &&
             (!('category' in data) || data.category is string) &&
             (!('notes' in data) || data.notes is string) &&
             (!('relatedId' in data) || data.relatedId is string) &&
             (!('paidMonths' in data) || data.paidMonths is list) &&
             (!('type' in data) || data.type in ['income', 'expense']) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidSavingsTarget(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['name', 'targetAmount', 'currentAmount', 'ownerId'])) &&
             data.keys().size() <= 30 &&
             (!('name' in data) || (data.name is string && data.name.size() <= 100)) &&
             (!('targetAmount' in data) || data.targetAmount is number) &&
             (!('currentAmount' in data) || data.currentAmount is number) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('deadline' in data) || data.deadline is timestamp || data.deadline == null) &&
             (!('color' in data) || data.color is string) &&
             (!('icon' in data) || data.icon is string) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    function isValidNotification(data, isUpdate, userId) {
      return (isUpdate || data.keys().hasAll(['title', 'message', 'date', 'read', 'ownerId'])) &&
             data.keys().size() <= 30 &&
             (!('title' in data) || data.title is string) &&
             (!('message' in data) || data.message is string) &&
             (!('ownerId' in data) || data.ownerId == userId) &&
             (!('id' in data) || data.id is string) &&
             (!('createdBy' in data) || data.createdBy is string) &&
             (!('createdAt' in data) || data.createdAt is timestamp) &&
             (!('type' in data) || data.type in ['info', 'warning', 'success']) &&
             (!('link' in data) || data.link is string) &&
             (!('relatedId' in data) || data.relatedId is string) &&
             (!('updatedAt' in data) || data.updatedAt == request.time);
    }

    // --- Collections ---

    // User Profile
    match /users/{userId} {
      allow list, get: if isSignedIn();
      allow create: if isOwner(userId) && isValidUser(incoming());
      allow update: if isOwner(userId) && isValidUser(incoming());
    }

    // Monthly Budgets Items
    match /users/{userId}/monthly_budgets/{monthYear}/items/{itemId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidId(monthYear) && isValidBudgetItem(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidBudgetItem(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Transactions
    match /users/{userId}/transactions/{transactionId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidTransaction(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidTransaction(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Wallets
    match /users/{userId}/wallets/{walletId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidWallet(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidWallet(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Budgets
    match /users/{userId}/budgets/{budgetId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidBudget(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidBudget(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Categories
    match /users/{userId}/categories/{categoryId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidCategory(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidCategory(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Debts
    match /users/{userId}/debts/{debtId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidDebt(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidDebt(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Simulations
    match /users/{userId}/simulations/{simId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidSimulation(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidSimulation(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Bills
    match /users/{userId}/bills/{billId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidBill(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidBill(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Recurring Transactions
    match /users/{userId}/recurring_transactions/{recurringId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidRecurring(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidRecurring(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Savings Targets
    match /users/{userId}/savings_targets/{targetId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidSavingsTarget(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidSavingsTarget(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Notifications
    match /users/{userId}/notifications/{notifId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidNotification(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidNotification(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }

    // Bundles
    match /users/{userId}/bundles/{bundleId} {
      allow list, get: if hasAccess(userId);
      allow create: if hasAccess(userId) && isValidBundle(incoming(), false, userId);
      allow update: if hasAccess(userId) && isValidBundle(incoming(), true, userId);
      allow delete: if hasAccess(userId);
    }
  }
}
```

## 3. Setup MySQL / PostgreSQL (Opsional)

Jika Anda ingin menggunakan database relasional (seperti MySQL atau PostgreSQL), skrip migrasi tersedia di folder:
`app/db/scripts/`

- **MySQL:** `app/db/scripts/mysql.sql`
- **PostgreSQL:** `app/db/scripts/postgres.sql`

Skrip ini berisi struktur tabel yang setara dengan skema Firestore yang digunakan di aplikasi ini.

## 4. Cara Menjalankan Lokal

1. Clone repository.
2. Jalankan `npm install`.
3. Buat file `.env` di root projek dan tambahkan variabel yang diperlukan (lihat `.env.example`).
4. Jalankan `npm run dev`.

## 5. Deploy ke Vercel

Lihat panduan lengkap di [INSTALL_VERCEL.md](./INSTALL_VERCEL.md).
