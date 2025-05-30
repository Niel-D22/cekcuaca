class AplikasiCuaca {
  constructor(kunciApi) {
    this.kunciApi = kunciApi;      // Simpan kunci API untuk ambil data cuaca
    this.daftarKota = [];          // Tempat menyimpan daftar kota dari file JSON
    this.offsetZonaWaktu = 0;      // Simpan selisih zona waktu dari API
    this.idIntervalWaktu = null;   // Simpan ID interval untuk update jam setiap detik
  }

  // Mulai jalankan aplikasi, pasang event listener untuk tombol dan input
  mulai() {
    this.muattDaftarKota();  // Muat data kota dari file JSON

    // Pasang event saat tombol cek diklik
    document.getElementById("checkButton").addEventListener("click", () => {
      this.tombolCekDitekan();
    });

    // Pasang event saat input kota berubah (untuk fitur autocomplete)
    document.getElementById("cityInput").addEventListener("input", () => {
      this.tampilkanSaran();
    });

    // Tutup daftar saran kalau klik di luar kotak input dan saran
    document.addEventListener("click", (e) => {
      const suggestions = document.getElementById("suggestions");
      if (!suggestions.contains(e.target) && e.target.id !== "cityInput") {
        this.hapusSaran();
      }
    });
  }

  // Ambil daftar kota dari file city.list.json, lalu simpan kota yang di Indonesia saja
  muattDaftarKota() {
    fetch("city.list.json")
      .then((res) => res.json())
      .then((data) => {
        this.daftarKota = data.filter((kota) => kota.country === "ID");
      })
      .catch((error) => {
        alert("Gagal memuat data kota. Pastikan file city.list.json ada ya.");
        console.error("Error muattDaftarKota:", error);
      });
  }

  // Fungsi dijalankan saat tombol cek cuaca ditekan
  tombolCekDitekan() {
    const namaKota = document.getElementById("cityInput").value.trim();

    if (!namaKota) {
      alert("Tolong isi nama kota dulu, ya.");
      return;
    }

    // Cari kota di daftar berdasarkan nama yang user input
    const kotaDicari = this.daftarKota.find(
      (k) => k.name.toLowerCase() === namaKota.toLowerCase()
    );

    if (!kotaDicari) {
      alert("Waduh, kota gak ketemu di daftar kota Indonesia.");
      this.sembunyikanHasil();
      return;
    }

    // Ambil data cuaca berdasarkan ID kota yang ditemukan
    this.ambilCuacaPerId(kotaDicari.id);
    this.hapusSaran();  // Sembunyikan saran autocomplete setelah klik
  }

  // Ambil data cuaca dari API openweathermap berdasarkan ID kota
  ambilCuacaPerId(idKota) {
    const url = `https://api.openweathermap.org/data/2.5/weather?id=${idKota}&appid=${this.kunciApi}&units=metric&lang=id`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data cuaca nih.");
        return res.json();
      })
      .then((data) => {
        this.offsetZonaWaktu = data.timezone;  // Simpan offset zona waktu dari API
        this.tampilkanCuaca(data);              // Tampilkan data cuaca ke halaman
        this.mulaiJam();                        // Mulai update jam lokal setiap detik
      })
      .catch((error) => {
        alert(error.message);
        this.sembunyikanHasil();
        console.error("Error ambilCuacaPerId:", error);
      });
  }

  // Tampilkan data cuaca dan informasi ke halaman web
  tampilkanCuaca(data) {
    document.getElementById("cityName").textContent = data.name;
    document.getElementById("weatherDesc").textContent =
      this.kapitalHurufPertama(data.weather[0].description);
    document.getElementById("temperature").textContent =
      data.main.temp.toFixed(1);

    this.perbaruiWaktuLokal();  // Update waktu lokal berdasarkan zona waktu

    document.getElementById("result").classList.remove("hidden");  // Tampilkan hasil
  }

  // Hitung dan tampilkan waktu lokal kota berdasarkan offset zona waktu
  perbaruiWaktuLokal() {
    const waktuUTC = new Date(
      Date.now() + new Date().getTimezoneOffset() * 60000
    );
    const waktuLokal = new Date(
      waktuUTC.getTime() + this.offsetZonaWaktu * 1000
    );

    document.getElementById("localTime").textContent =
      waktuLokal.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
  }

  // Mulai interval untuk update waktu lokal setiap detik
  mulaiJam() {
    if (this.idIntervalWaktu) clearInterval(this.idIntervalWaktu);
    this.idIntervalWaktu = setInterval(() => this.perbaruiWaktuLokal(), 1000);
  }

  // Sembunyikan hasil data cuaca di halaman
  sembunyikanHasil() {
    document.getElementById("result").classList.add("hidden");
  }

  // Buat huruf pertama jadi kapital, sisanya tetap
  kapitalHurufPertama(teks) {
    if (!teks) return "";
    return teks.charAt(0).toUpperCase() + teks.slice(1);
  }

  // Tampilkan daftar saran nama kota berdasarkan input user (autocomplete)
  tampilkanSaran() {
    this.hapusSaran();

    const input = document.getElementById("cityInput");
    const saranContainer = document.getElementById("suggestions");

    if (!input.value || input.value.trim().length < 2) return;

    const nilaiInput = input.value.trim().toLowerCase();

    // Cari maksimal 10 kota yang namanya diawali dengan input user
    const hasilFilter = this.daftarKota
      .filter((kota) => kota.name.toLowerCase().startsWith(nilaiInput))
      .slice(0, 10);

    hasilFilter.forEach((kota) => {
      const div = document.createElement("div");
      div.textContent = kota.name;
      div.classList.add("suggestion-item");
      div.style.padding = "5px";
      div.style.cursor = "pointer";

      // Kalau klik salah satu saran, isi input dengan nama kota itu
      div.addEventListener("click", () => {
        input.value = kota.name;
        this.hapusSaran();
      });

      saranContainer.appendChild(div);
    });
  }

  // Hapus semua saran yang tampil di bawah input
  hapusSaran() {
    const saranContainer = document.getElementById("suggestions");
    if (saranContainer) saranContainer.innerHTML = "";
  }
}

// Buat objek aplikasi dan jalankan mulai()
const aplikasiCuaca = new AplikasiCuaca("f859548cba3e8d12250174b64958f9cf");
aplikasiCuaca.mulai();
