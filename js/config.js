/* Emanet ayarları.
   supabaseUrl ve supabaseKey boşsa uygulama yalnızca bu cihazda çalışır (giriş ekranı çıkmaz).
   Değerler Supabase panelinde: Project Settings → API → "Project URL" ve "anon public" anahtarı.
   anon anahtarı herkese açık olacak şekilde tasarlanmıştır; verileri satır güvenliği (RLS) korur. */
window.EMANET_CONFIG = {
  supabaseUrl: "https://clwgjupnigenndbbkcnk.supabase.co",
  supabaseKey: "",
  branch: "main"
};
