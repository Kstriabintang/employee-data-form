/* ========================================
   Employee Data Portal — Employee Form Logic
   ======================================== */

(function () {
  'use strict';

  const TOTAL_STEPS = 5;
  const DRAFT_KEY = 'employee_form_draft_v1';
  // GANTI URL ini dengan URL deployment Google Apps Script-mu
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

  let currentStep = 1;

  const form = document.getElementById('employeeForm');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const stepsList = document.getElementById('stepsList');
  const progressBar = document.getElementById('progressBar');
  const summaryContainer = document.getElementById('summaryContainer');
  const successState = document.getElementById('successState');
  const newEntryBtn = document.getElementById('newEntryBtn');
  const alamatSama = document.getElementById('alamat_sama');
  const alamatDomisili = document.getElementById('alamat_domisili');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const draftStatus = document.getElementById('draftStatus');

  // Navigation
  nextBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      renderStep();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      renderStep();
    }
  });

  // Alamat domisili sama dengan KTP
  alamatSama.addEventListener('change', () => {
    if (alamatSama.checked) {
      alamatDomisili.value = document.getElementById('alamat_ktp').value;
      alamatDomisili.disabled = true;
    } else {
      alamatDomisili.value = '';
      alamatDomisili.disabled = false;
      alamatDomisili.focus();
    }
    saveDraft();
  });

  document.getElementById('alamat_ktp').addEventListener('input', () => {
    if (alamatSama.checked) {
      alamatDomisili.value = document.getElementById('alamat_ktp').value;
      saveDraft();
    }
  });

  // Save draft
  form.addEventListener('input', (e) => {
    if (e.target.type !== 'file') saveDraft();
  });
  form.addEventListener('change', (e) => {
    if (e.target.type !== 'file') saveDraft();
  });

  // File dropzone hints
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const hint = document.getElementById('hint-' + input.id);
      if (input.files && input.files[0]) {
        hint.textContent = input.files[0].name;
        input.parentElement.classList.add('has-file');
      } else {
        hint.textContent = 'Ketuk untuk pilih file';
        input.parentElement.classList.remove('has-file');
      }
      saveDraftFilesInfo();
    });
  });

  function renderStep() {
    document.querySelectorAll('.step-panel').forEach((panel, idx) => {
      panel.classList.toggle('active', idx + 1 === currentStep);
    });

    document.querySelectorAll('.step').forEach((step, idx) => {
      step.classList.remove('active', 'completed');
      if (idx + 1 === currentStep) step.classList.add('active');
      else if (idx + 1 < currentStep) step.classList.add('completed');
    });

    const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    progressBar.style.width = progress + '%';

    prevBtn.disabled = currentStep === 1;

    if (currentStep === TOTAL_STEPS) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
      buildSummary();
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(step) {
    const panel = document.getElementById('step-' + step);
    const inputs = panel.querySelectorAll('input:not([type="file"]), select, textarea');
    let valid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) valid = false;
    });

    // Validasi file yang wajib diunggah
    const fileInputs = panel.querySelectorAll('input[type="file"][required]');
    fileInputs.forEach((input) => {
      const err = document.getElementById('error-' + input.name);
      if (!input.files || !input.files[0]) {
        if (err) err.textContent = 'File ini wajib diunggah.';
        valid = false;
      } else if (err) {
        err.textContent = '';
      }
    });

    return valid;
  }

  function validateField(input) {
    const err = document.getElementById('error-' + input.name);
    if (!err) return true;

    let msg = '';
    const value = input.value.trim();

    if (input.required && !value) {
      msg = 'Field ini wajib diisi.';
    } else if (value) {
      switch (input.name) {
        case 'nik':
        case 'no_kk':
          if (!/^\d{16}$/.test(value)) msg = 'Nomor ini harus 16 digit angka.';
          break;
        case 'no_hp':
        case 'no_hp_kd':
          if (!/^08\d{8,11}$/.test(value)) msg = 'Nomor HP tidak valid (contoh: 081234567890).';
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Format email tidak valid.';
          break;
        case 'tanggal_lahir':
          if (new Date(value) > new Date()) msg = 'Tanggal lahir tidak boleh di masa depan.';
          break;
        case 'tanggal_masuk':
          if (new Date(value) > new Date()) msg = 'Tanggal masuk tidak boleh di masa depan.';
          break;
      }
    }

    err.textContent = msg;
    input.classList.toggle('invalid', !!msg);
    return !msg;
  }

  // Real-time validation
  form.querySelectorAll('input:not([type="file"]), select, textarea').forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) validateField(input);
    });
  });

  // Summary builder
  function buildSummary() {
    const data = new FormData(form);

    const sections = [
      {
        title: 'Data Pribadi',
        fields: [
          { label: 'Nama Lengkap', name: 'nama_lengkap' },
          { label: 'NIK', name: 'nik' },
          { label: 'No. KK', name: 'no_kk' },
          { label: 'Status dalam KK', name: 'status_kk' },
          { label: 'Tempat, Tanggal Lahir', combine: ['tempat_lahir', 'tanggal_lahir'], fmt: (a, b) => `${a || '-'}, ${formatDate(b)}` },
          { label: 'Jenis Kelamin', name: 'jenis_kelamin' },
          { label: 'Status Perkawinan', name: 'status_perkawinan' },
          { label: 'Agama', name: 'agama' },
          { label: 'Pendidikan Terakhir', name: 'pendidikan_terakhir' },
          { label: 'Alamat KTP', name: 'alamat_ktp' },
          { label: 'Alamat Domisili', name: 'alamat_domisili' },
          { label: 'No. HP', name: 'no_hp' },
          { label: 'Email', name: 'email' },
        ],
      },
      {
        title: 'Data Kepegawaian',
        fields: [
          { label: 'Jabatan / Posisi', name: 'jabatan' },
          { label: 'Tanggal Mulai Kerja', name: 'tanggal_masuk', fmt: formatDate },
          { label: 'Status Karyawan', name: 'status_karyawan' },
          { label: 'NPWP', name: 'npwp' },
        ],
      },
      {
        title: 'Kontak Darurat',
        fields: [
          { label: 'Nama', name: 'nama_kd' },
          { label: 'Hubungan', name: 'hubungan_kd' },
          { label: 'No. HP', name: 'no_hp_kd' },
        ],
      },
      {
        title: 'Dokumen',
        fields: [
          { label: 'KTP', name: 'file_ktp', type: 'file' },
          { label: 'Kartu Keluarga', name: 'file_kk', type: 'file' },
          { label: 'NPWP', name: 'file_npwp', type: 'file' },
        ],
      },
    ];

    summaryContainer.innerHTML = '';

    sections.forEach((sec) => {
      const card = document.createElement('div');
      card.className = 'summary-card';
      let html = `<h3>${sec.title}</h3><dl>`;

      sec.fields.forEach((f) => {
        let value;
        if (f.combine) {
          const vals = f.combine.map((n) => data.get(n));
          value = f.fmt ? f.fmt(...vals) : vals.filter(Boolean).join(', ');
        } else if (f.type === 'file') {
          const input = document.getElementById(f.name);
          value = input && input.files && input.files[0] ? input.files[0].name : '-';
        } else {
          value = data.get(f.name);
          if (f.fmt) value = f.fmt(value);
        }
        html += `<div class="summary-row"><dt>${f.label}</dt><dd>${value || '-'}</dd></div>`;
      });

      html += '</dl>';
      card.innerHTML = html;
      summaryContainer.appendChild(card);
    });
  }

  function formatDate(str) {
    if (!str) return '-';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  // Draft persistence
  function saveDraft() {
    const data = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    updateDraftStatus();
  }

  function saveDraftFilesInfo() {
    const data = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      data[input.name + '_name'] = input.files && input.files[0] ? input.files[0].name : '';
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    updateDraftStatus();
  }

  function updateDraftStatus() {
    if (!draftStatus) return;
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    draftStatus.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Draft tersimpan pukul ' + time;
  }

  function showToast(message, duration) {
    duration = duration || 4000;
    if (!toast || !toastMsg) {
      alert(message);
      return;
    }
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      Object.keys(data).forEach((key) => {
        if (key.endsWith('_name')) return;
        const el = form.elements[key];
        if (!el) return;

        if (el.type === 'checkbox') {
          el.checked = !!data[key];
        } else {
          el.value = data[key] || '';
        }
      });

      document.querySelectorAll('input[type="file"]').forEach((input) => {
        const name = data[input.name + '_name'];
        const hint = document.getElementById('hint-' + input.name);
        if (name && hint) {
          hint.textContent = name;
          input.parentElement.classList.add('has-file');
        }
      });

      alamatDomisili.disabled = alamatSama.checked;
    } catch (e) {
      localStorage.removeItem(DRAFT_KEY);
    }
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Mengirim...';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.token = 'YOUR_SECRET_TOKEN';

    payload.files = {};
    const fileInputs = ['file_ktp', 'file_kk', 'file_npwp'];

    try {
      for (const key of fileInputs) {
        const input = document.getElementById(key);
        if (input && input.files && input.files[0]) {
          const file = input.files[0];
          if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file ' + file.name + ' melebihi batas 5 MB.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Data';
            return;
          }
          const base64 = await readFileBase64(file);
          payload.files[key] = { name: file.name, mime: file.type, data: base64 };
        }
      }

      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        form.classList.add('hidden');
        document.querySelector('.progress').classList.add('hidden');
        document.getElementById('formActions').classList.add('hidden');
        successState.classList.remove('hidden');
        localStorage.removeItem(DRAFT_KEY);
      } else {
        throw new Error(json.message || 'Gagal menyimpan data.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Data';
    }
  });

  function readFileBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // New entry
  newEntryBtn.addEventListener('click', () => {
    form.reset();
    currentStep = 1;
    document.querySelectorAll('.step').forEach((s) => s.classList.remove('active', 'completed'));
    document.querySelector('.step[data-step="1"]').classList.add('active');
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      const hint = document.getElementById('hint-' + input.id);
      hint.textContent = 'Ketuk untuk pilih file';
      input.parentElement.classList.remove('has-file');
    });
    alamatDomisili.disabled = false;
    document.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
    document.querySelectorAll('.error-msg').forEach((el) => (el.textContent = ''));

    form.classList.remove('hidden');
    document.querySelector('.progress').classList.remove('hidden');
    document.getElementById('formActions').classList.remove('hidden');
    successState.classList.add('hidden');
    renderStep();
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Init
  loadDraft();
  updateDraftStatus();
  renderStep();
})();
