// --- Asthenya Ambient Music Controller & SPA Navigation ---
const playlist = [
    { title: "Asthenya Ana Tema", src: "audio/Asthenya Arkaplan Music.mp3" },
    { title: "Karanlık Vadi Fısıltıları", src: "audio/Asthenya Arkaplan Music.mp3" },
    { title: "Kadim Tanrıların Uyanışı", src: "audio/Asthenya Arkaplan Music.mp3" }
];

let currentTrackIndex = parseInt(localStorage.getItem('ast_music_track')) || 0;

// Kullanıcı siteye girdiğinde veya F5 attığında her zaman çalsın
let isPlaying = true;
localStorage.setItem('ast_music_playing', 'true');

let savedVolume = parseFloat(localStorage.getItem('ast_music_volume'));
if (isNaN(savedVolume) || savedVolume <= 0) savedVolume = 0.3; // Varsayılan ses %30

let audio = new Audio(playlist[currentTrackIndex].src);
audio.volume = savedVolume;
audio.muted = false;
audio.loop = true;

// F5 atıldığında müziğin kaldığı yerden devam etmesi
const savedTime = parseFloat(localStorage.getItem('ast_music_time'));
if (!isNaN(savedTime) && savedTime > 0) {
    audio.currentTime = savedTime;
}

document.addEventListener("DOMContentLoaded", () => {
    // --- Yüklenme Ekranı (Loading Screen) - Sinematik Kapı Açılışı ---
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add("gate-open");
            setTimeout(() => {
                loadingScreen.style.visibility = "hidden";
                loadingScreen.style.pointerEvents = "none";
            }, 1500); // Kapıların açılma süresi (1.5s) bitince tıklamaları engelle
        }, 3500); // 3.5 saniye ekranda kalır, ardından kapılar ikiye ayrılır
    }

    // --- Duyuru Yükleme ve Senkronizasyon (F5 Gerektirmeden) ---
    window.loadAnnouncements = function () {
        try {
            const anns = JSON.parse(localStorage.getItem('asthenya_announcements') || '[]');
            const listContainer = document.getElementById('announcement-list');
            const emptyBox = document.getElementById('no-ann-box');

            if (anns.length > 0) {
                if (emptyBox) emptyBox.style.display = 'none';
                if (listContainer) {
                    listContainer.innerHTML = anns.map(a => {
                        const contentStr = a.content || '';
                        const isLong = contentStr.length > 100;
                        const displayContent = isLong ? contentStr.substring(0, 100) + '...' : contentStr;
                        const readMoreBtn = `<button onclick="openFerman(${a.id})" class="event-btn" style="margin-left: auto; padding: 0.3rem 1rem; font-size: 0.8rem; background: rgba(223, 183, 84, 0.1); color: var(--gold); border: 1px solid var(--gold); border-radius: 6px; cursor: pointer;">Devamını Oku</button>`;

                        return `
                        <div class="event-card" style="margin-bottom: 1rem;">
                            <div class="event-image"><i class="fa-solid fa-scroll" style="color: var(--gold);"></i></div>
                            <div class="event-content">
                                <div class="event-date">${a.date || ''}</div>
                                <h3 class="event-title" style="margin-bottom:0.5rem;">${a.title || 'Ferman'}</h3>
                                <p class="event-desc" style="white-space: pre-wrap;">${displayContent}</p>
                                <div class="event-footer" style="display:flex; align-items:center;">
                                    <span class="event-tag" style="background: rgba(223, 183, 84, 0.2); color: var(--gold); border: 1px solid var(--gold);">RESMİ FERMAN</span>
                                    ${readMoreBtn}
                                </div>
                            </div>
                        </div>
                    `}).join('');
                }
            } else {
                if (emptyBox) emptyBox.style.display = 'flex';
                if (listContainer) listContainer.innerHTML = '';
            }

        } catch (err) {
            console.error("Duyuru yuklenirken hata olustu: ", err);
        }
    };


    window.openFerman = function (id) {
        const anns = JSON.parse(localStorage.getItem('asthenya_announcements') || '[]');
        const ann = anns.find(a => a.id === id);
        if (!ann) return;

        const titleEl = document.getElementById('reader-title');
        const contentEl = document.getElementById('reader-content');
        const dateEl = document.getElementById('reader-date');
        const tagEl = document.getElementById('reader-tag');

        if (titleEl) titleEl.textContent = ann.title;
        if (contentEl) contentEl.innerHTML = `<p style="white-space: pre-wrap; color: #ccc; line-height: 1.8;">${ann.content}</p>`;
        if (dateEl) dateEl.textContent = ann.date;
        if (tagEl) tagEl.textContent = 'RESMİ FERMAN';

        const overlay = document.getElementById('ferman-reader-overlay');
        if (overlay) overlay.style.display = 'flex';
    };

    window.closeFerman = function () {
        const overlay = document.getElementById('ferman-reader-overlay');
        if (overlay) overlay.style.display = 'none';
    };

    // İlk açılışta yükle
    loadAnnouncements();

    // Farklı tab'dan (admin) ferman atıldığında anında güncelle
    window.addEventListener('storage', (e) => {
        if (e.key === 'asthenya_announcements') {
            loadAnnouncements();
        }
    });

    // --- SPA Navigation Logic ---
    const menuButtons = document.querySelectorAll('.sidebar .menu-btn, .top-nav .menu-btn');
    const pageSections = document.querySelectorAll('.page-section');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetHref = btn.getAttribute('href');
            if (targetHref && targetHref.startsWith('#')) {
                e.preventDefault();
                const targetId = targetHref.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    menuButtons.forEach(b => b.classList.remove('active'));
                    pageSections.forEach(s => s.classList.remove('active'));
                    btn.classList.add('active');
                    targetSection.classList.add('active');

                    // Duyurulara tıklandığında badge sıfırla (OTOMATİK SİLME İPTAL EDİLDİ)
                    if (targetId === 'duyurular') {
                        if (typeof loadAnnouncements === 'function') loadAnnouncements();
                    }
                }
            }
        });
    });

    // --- Music HUD Toggle (Gizle/Göster) ---
    const musicHud = document.getElementById("music-hud");
    const musicHudToggle = document.getElementById("music-hud-toggle");

    if (musicHud && musicHudToggle) {
        musicHudToggle.addEventListener("click", () => {
            musicHud.classList.toggle("collapsed");
        });
    }

    // --- Music Controller Logic ---
    const playPauseBtn = document.getElementById("music-play-pause");
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
    const prevBtn = document.getElementById("music-prev");
    const nextBtn = document.getElementById("music-next");
    const volumeSlider = document.getElementById("music-volume-slider");
    const volumeIconBtn = document.getElementById("music-volume-btn");
    const volumeIcon = volumeIconBtn ? volumeIconBtn.querySelector("i") : null;
    const trackTitleDisplay = document.getElementById("music-track-title");
    const discIcon = document.getElementById("music-disc-icon");

    function updateUI() {
        if (!playPauseIcon || !trackTitleDisplay) return;

        trackTitleDisplay.textContent = playlist[currentTrackIndex].title;

        if (isPlaying) {
            playPauseIcon.className = "fa-solid fa-pause";
            if (discIcon) discIcon.style.animationPlayState = "running";
        } else {
            playPauseIcon.className = "fa-solid fa-play";
            if (discIcon) discIcon.style.animationPlayState = "paused";
        }

        if (volumeSlider) volumeSlider.value = audio.volume;
        updateVolumeIcon(audio.volume);
    }

    function updateVolumeIcon(vol) {
        if (!volumeIcon) return;
        if (vol === 0 || audio.muted) {
            volumeIcon.className = "fa-solid fa-volume-xmark";
        } else if (vol < 0.5) {
            volumeIcon.className = "fa-solid fa-volume-low";
        } else {
            volumeIcon.className = "fa-solid fa-volume-high";
        }
    }

    // OTOMATİK OYNATMA MANTIĞI
    function attemptAutoplay() {
        audio.muted = false;

        // Tarayıcının müziği çalmasına izin verip vermediğini kontrol et
        let playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Tarayıcı direkt çalmaya izin verdi (Genelde siteyle daha önce etkileşime girilmişse olur)
                isPlaying = true;
                updateUI();
            }).catch(err => {
                console.warn("Tarayıcı otomatik oynatmayı engelledi. Kullanıcı etkileşimi bekleniyor...");

                // Tarayıcı engellerse, fare hareketi veya tıklama gibi ilk eylemde müziği zorla başlat
                const gestureEvents = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];

                const unlockAudio = () => {
                    audio.muted = false;
                    audio.play().then(() => {
                        isPlaying = true;
                        updateUI();
                        // Müzik başladıktan sonra event listener'ları temizle ki performans düşmesin
                        gestureEvents.forEach(e => document.removeEventListener(e, unlockAudio));
                    }).catch(e => console.error("Fiziksel kilit açma hatası:", e));
                };

                // Tüm etkileşimleri dinle, sadece BİR KERE çalışsın
                gestureEvents.forEach(e => document.addEventListener(e, unlockAudio, { once: true }));
                updateUI();
            });
        }
    }

    function pauseAudio() {
        audio.pause();
        isPlaying = false;
        localStorage.setItem('ast_music_playing', 'false');
        updateUI();
    }

    function playAudio() {
        audio.muted = false;
        audio.play().then(() => {
            isPlaying = true;
            localStorage.setItem('ast_music_playing', 'true');
            updateUI();
        }).catch(err => console.error("Manuel oynatma hatası:", err));
    }

    function loadTrack(index) {
        audio.pause();
        currentTrackIndex = index;
        localStorage.setItem('ast_music_track', currentTrackIndex);
        audio.src = playlist[currentTrackIndex].src;
        audio.currentTime = 0;
        playAudio();
    }

    // Event Listeners
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            isPlaying ? pauseAudio() : playAudio();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let newIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            loadTrack(newIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let newIndex = (currentTrackIndex + 1) % playlist.length;
            loadTrack(newIndex);
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            const vol = parseFloat(e.target.value);
            audio.volume = vol;
            audio.muted = vol === 0;
            if (vol > 0) savedVolume = vol;
            localStorage.setItem('ast_music_volume', vol);
            updateVolumeIcon(vol);
        });
    }

    if (volumeIconBtn) {
        volumeIconBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (audio.volume > 0 || !audio.muted) {
                audio.muted = true;
                audio.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
                updateVolumeIcon(0);
            } else {
                audio.muted = false;
                audio.volume = savedVolume > 0 ? savedVolume : 0.3;
                if (volumeSlider) volumeSlider.value = audio.volume;
                updateVolumeIcon(audio.volume);
            }
            localStorage.setItem('ast_music_volume', audio.volume);
        });
    }

    // Süreyi kaydet
    setInterval(() => {
        if (isPlaying && !audio.paused) {
            localStorage.setItem('ast_music_time', audio.currentTime);
        }
    }, 1000);

    // --- TANRI SIRALAMA SİSTEMİ (Meclis Sözü & Güç Sıralaması) ---
    window.sortGods = (criteria) => {
        const grid = document.querySelector('.gods-grid');
        const cards = Array.from(grid.querySelectorAll('.god-card'));
        const filterBtns = document.querySelectorAll('.gods-filters .academy-filter-btn');

        filterBtns.forEach(btn => btn.classList.remove('active'));
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        const romanToNum = (roman) => {
            const map = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14 };
            return map[roman] || 99;
        };

        const powerOrderMap = {
            'xanax': 1, 'warnar': 2, 'leopolde': 3, 'casemir': 4, 'magiena': 5,
            'malafez': 6, 'osentha': 7, 'thorgin': 8, 'emparos': 9, 'vespadora': 10,
            'sima': 11, 'merinos': 12, 'miu': 13, 'x': 14
        };

        const respectOrderMap = {
            'sima': 1, 'emparos': 2, 'osentha': 3, 'miu': 4, 'casemir': 5,
            'merinos': 6, 'thorgin': 7, 'xanax': 8, 'vespadora': 9, 'malafez': 10,
            'magiena': 11, 'warnar': 12, 'x': 13, 'leopolde': 14
        };

        const sortedCards = cards.sort((a, b) => {
            const idA = a.getAttribute('data-god-id');
            const idB = b.getAttribute('data-god-id');

            // Karşılaştırma için orijinal rankları al (Sıralama ne olursa olsun kimlikleri korumak için)
            const originalRankA = romanToNum(a.getAttribute('data-original-rank') || a.querySelector('.god-rank').textContent.trim());
            const originalRankB = romanToNum(b.getAttribute('data-original-rank') || b.querySelector('.god-rank').textContent.trim());

            if (criteria === 'rank') {
                return originalRankA - originalRankB;
            } else if (criteria === 'power') {
                return (powerOrderMap[idA] || 99) - (powerOrderMap[idB] || 99);
            } else if (criteria === 'respect') {
                return (respectOrderMap[idA] || 99) - (respectOrderMap[idB] || 99);
            }
            return 0;
        });

        const numToRoman = (num) => {
            const romanArr = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"];
            return romanArr[num] || num;
        };

        // Grid'i temizle ve sıralanmış kartları ekle, ardından rakamları güncelle
        grid.innerHTML = '';
        sortedCards.forEach((card, index) => {
            // Orijinal rankı ilk kez sakla (Sadece bir kez çalışır)
            if (!card.hasAttribute('data-original-rank')) {
                card.setAttribute('data-original-rank', card.querySelector('.god-rank').textContent.trim());
            }

            // Yeni rütbeyi (I, II, III...) ata
            card.querySelector('.god-rank').textContent = numToRoman(index + 1);
            grid.appendChild(card);
        });
    };

    // Sayfa yüklendiğinde orijinal sıralamayı (Güç Sıralaması) sakla
    const godsGrid = document.querySelector('.gods-grid');
    if (godsGrid) {
        const initialCards = godsGrid.querySelectorAll('.god-card');
        initialCards.forEach((card, index) => {
            card.setAttribute('data-original-index', index);
        });
    }

    // --- KADİM TANRILAR VERİTABANI & MODAL YÖNETİMİ ---
    const godsData = {
        casemir: {
            name: "Cassemır De Von Capllan",
            title: "Yaratık Tanrısı",
            color: "#d97706",
            colorDim: "rgba(217, 119, 6, 0.4)",
            colorGlow: "rgba(217, 119, 6, 0.25)",
            colorBgGlow: "rgba(217, 119, 6, 0.12)",
            img: "img/Tanrılar/Casemir.png",
            story: "Asthenya evreninin en ücra ve vahşi köşelerinde gezinen tüm canavarların, efsanevi yaratıkların ve boyun eğmez canlıların mutlak efendisi Cassemır De Von Capllan. Onun kükremesi diyarın en derin mağaralarında yankılanır. Yaratıklara hükmetmek ve vahşi doğanın ilkel gücünü kullanmak isteyenler onun mührüne sığınır.",
            blessing: "Vahşi Hüküm & Yaratıkların Gazabı",
            effectType: "effect-casemir"
        },
        emparos: {
            name: "Emparos",
            title: "Elflerin Tanrısı",
            color: "#10b981",
            colorDim: "rgba(16, 185, 129, 0.4)",
            colorGlow: "rgba(16, 185, 129, 0.25)",
            colorBgGlow: "rgba(16, 185, 129, 0.12)",
            img: "img/Tanrılar/Emparos.png",
            story: "Kadim elf ırkının yaratıcısı ve koruyucusu Emparos. Kadim ormanların zarafeti, keskin okçuluk yetenekleri ve doğa büyüsünün incelikleri onun lütfundan gelir. Elfler, Emparos'un bilgeliği sayesinde asırlardır diyarın en köklü ve zarif uygarlıklarından birini sürdürmektedir.",
            blessing: "Elflerin Zarafeti & Kadim Orman Büyüsü",
            effectType: "effect-emparos"
        },
        leopolde: {
            name: "Leopolde",
            title: "Yıkım Tanrısı",
            color: "#ef4444",
            colorDim: "rgba(239, 68, 68, 0.4)",
            colorGlow: "rgba(239, 68, 68, 0.25)",
            colorBgGlow: "rgba(239, 68, 68, 0.12)",
            img: "img/Tanrılar/Leopolde.png",
            story: "Var olan her şeyin bir gün son bulacağını hatırlatan mutlak kaos ve yıkım gücü Leopolde. Onun geçtiği yerlerde krallıklar küle, dağlar toza dönüşür. Evrenin dengesini sağlamak için eskiyi yok edip yeniye yer açan acımasız ama zorunlu bir kozmik kuvvettir.",
            blessing: "Mutlak Yıkım & Küllerin Gazabı",
            effectType: "effect-leopolde"
        },
        magiena: {
            name: "Magıena",
            title: "Yaşayan En Güçlü Büyücü",
            color: "#8b5cf6",
            colorDim: "rgba(139, 92, 246, 0.4)",
            colorGlow: "rgba(139, 92, 246, 0.25)",
            colorBgGlow: "rgba(139, 92, 246, 0.12)",
            img: "img/Tanrılar/Magiena.png",
            story: "Tanrısallığa kendi iradesi ve eşsiz arkana bilgisiyle ulaşmış, diyardaki tüm büyü akıntılarına hükmeden Magıena. O, sıradan büyücülerin hayal bile edemeyeceği yasaklı formülleri ve boyut kapılarını parmaklarının ucuyla kontrol eder. Asthenya'daki tüm büyü loncaları onun adını saygıyla anar.",
            blessing: "Sınırsız Arkana & Boyutların Hakimi",
            effectType: "effect-magiena"
        },
        malafez: {
            name: "Malafez",
            title: "Ejder Tanrıçası",
            color: "#dc2626",
            colorDim: "rgba(220, 38, 38, 0.4)",
            colorGlow: "rgba(220, 38, 38, 0.25)",
            colorBgGlow: "rgba(220, 38, 38, 0.12)",
            img: "img/Tanrılar/Malafez.png",
            story: "Gökyüzünü kaplayan devasa kanatları ve diyarın en sert metallerini bile eriten nefesiyle Malafez, tüm ejderha soylarının anasıdır. Göğün en yüksek zirvelerinde taht kurmuştur. Onun kanını taşıyan ejderhalar ve ejderha binicileri, göklerin tartışmasız hakimleridir.",
            blessing: "Ejderha Nefesi & Göklerin Öfkesi",
            effectType: "effect-malafez"
        },
        merinos: {
            name: "Merinos",
            title: "Zaman ve Kehanet Tanrıçası",
            color: "#06b6d4",
            colorDim: "rgba(6, 182, 212, 0.4)",
            colorGlow: "rgba(6, 182, 212, 0.25)",
            colorBgGlow: "rgba(6, 182, 212, 0.12)",
            img: "img/Tanrılar/Merinos.png",
            story: "Geçmişin, şimdinin ve geleceğin ipliklerini elinde tutan Merinos. Onun gözleri zamanın ötesini görür; krallıkların çöküşünü ve kahramanların doğuşunu asırlar öncesinden fısıldar. Kahinler ve zaman bükücüler, kaderin ağlarını anlamak için Merinos'un vizyonlarına sığınır.",
            blessing: "Zamanın Gözü & Kusursuz Kehanet",
            effectType: "effect-merinos"
        },
        miu: {
            name: "Miu",
            title: "Yıldız Gezen Tanrıçası",
            color: "#ec4899",
            colorDim: "rgba(236, 72, 153, 0.4)",
            colorGlow: "rgba(236, 72, 153, 0.25)",
            colorBgGlow: "rgba(236, 72, 153, 0.12)",
            img: "img/Tanrılar/Miu.png",
            story: "Uzayın sonsuz boşluğunda, galaksiler ve yıldız sistemleri arasında dans eden Miu. Asthenya göğündeki kayan yıldızlar ve takımyıldızları onun ayak izleridir. Kozmik enerjileri ve göksel navigasyonu kullanan gezginler, Miu'nun yıldız ışığıyla yollarını bulur.",
            blessing: "Yıldız Tozu & Galaktik Seyahat",
            effectType: "effect-miu"
        },
        osentha: {
            name: "Osentha",
            title: "İstenmeyenlerin Tanrıçası",
            color: "#64748b",
            colorDim: "rgba(100, 116, 139, 0.4)",
            colorGlow: "rgba(100, 116, 139, 0.25)",
            colorBgGlow: "rgba(100, 116, 139, 0.12)",
            img: "img/Tanrılar/Osentha.png",
            story: "Toplumdan dışlanmış, sürgüne gönderilmiş, karanlık sokaklarda kaderine terk edilmiş tüm fani ruhların sığınağı Osentha. O, diyarın unuttuğu ve hor gördüğü kimselere kucak açar, onlara gölgelerin içinde yepyeni bir güç ve yaşama amacı bahşeder.",
            blessing: "Sürgünlerin Sığınağı & Gölgelerin Şefkati",
            effectType: "effect-osentha"
        },
        sima: {
            name: "Simha",
            title: "Bilim Tanrısı",
            color: "#0ea5e9",
            colorDim: "rgba(14, 165, 233, 0.4)",
            colorGlow: "rgba(14, 165, 233, 0.25)",
            colorBgGlow: "rgba(14, 165, 233, 0.12)",
            img: "img/Tanrılar/Sima.png",
            story: "Evrenin işleyişini, simyanın temel kanunlarını ve mekanik düzeni yöneten Simha. Büyünün bile mantıksal bir formüle dayandığını savunan alimlerin, mucitlerin ve mühendislerin rehberidir. Asthenya'daki en büyük icatlar ve teknolojik sıçramalar onun ilhamıyla gerçekleşir.",
            blessing: "Kusursuz Formül & İnovasyon Işığı",
            effectType: "effect-simha"
        },
        thorgin: {
            name: "Thorgrın",
            title: "İlk Efsanevi Silah Yapan Kişi",
            color: "#f97316",
            colorDim: "rgba(249, 115, 22, 0.4)",
            colorGlow: "rgba(249, 115, 22, 0.25)",
            colorBgGlow: "rgba(249, 115, 22, 0.12)",
            img: "img/Tanrılar/Thorgin.png",
            story: "Asthenya tarihinin ilk ve en kudretli efsanevi silahlarını döven ulu zanaatkar Thorgrın. Onun örsünden çıkan her kılıç bir efsaneye, her kalkan aşılmaz bir duvara dönüşmüştür. Diyarın en usta demircileri, onun kutsal çekicinin ritmini yakalamak için ömür harcar.",
            blessing: "Efsanevi Örs & Usta Zanaatkarlık",
            effectType: "effect-thorgrin"
        },
        vespadora: {
            name: "Vespadora",
            title: "Yaratılış Tanrıçası",
            color: "#eab308",
            colorDim: "rgba(234, 179, 8, 0.4)",
            colorGlow: "rgba(234, 179, 8, 0.25)",
            colorBgGlow: "rgba(234, 179, 8, 0.12)",
            img: "img/Tanrılar/Vespadora.png",
            story: "Hiçliğin ortasında ilk kıvılcımı çakan, gezegenlere şekil veren ve yaşama ilk nefesi üfleyen ulu Yaratılış Tanrıçası Vespadora. Asthenya evrenindeki tüm güzelliklerin, dağların, nehirlerin ve canlılığın mimarıdır. Onun lütfu, yokluktan varlık yaratma kudretidir.",
            blessing: "Yaratılış Kıvılcımı & İlk Nefes",
            effectType: "effect-vespadora"
        },
        warnar: {
            name: "Warnar",
            title: "Savaş Tanrısı",
            color: "#b91c1c",
            colorDim: "rgba(185, 28, 28, 0.4)",
            colorGlow: "rgba(185, 28, 28, 0.25)",
            colorBgGlow: "rgba(185, 28, 28, 0.12)",
            img: "img/Tanrılar/Warnar.png",
            story: "Savaş meydanlarının mutlak hakimi, orduların önünde korkusuzca yürüyen Warnar. Kılıç şıngırtıları, zafer naraları ve taktiksel dehanın tanrısıdır. Adaleti ve onuru korumak için kılıç çeken her savaşçının bileğine Warnar'ın yenilmez kudreti dolar.",
            blessing: "Savaşın Gazabı & Yenilmez Taktik",
            effectType: "effect-warnar"
        },
        x: {
            name: "X",
            title: "??? Hakkında Bilgi Yok",
            color: "#94a3b8",
            colorDim: "rgba(148, 163, 184, 0.4)",
            colorGlow: "rgba(148, 163, 184, 0.25)",
            colorBgGlow: "rgba(148, 163, 184, 0.12)",
            img: "img/Tanrılar/X.png",
            story: "Asthenya evreninin en derin sırrı. Kadim parşömenlerde, taş kitabelerde veya tanrıların hafızasında bile onun hakkında tek bir kelime bilgi bulunmaz. Sadece 'X' mührüyle bilinen bu varlık, evrenin açıklanamayan ve asla ulaşılamayan karanlık yüzüdür.",
            blessing: "??? Bilinmeyen Kudret",
            effectType: "effect-x"
        },
        xanax: {
            name: "Xanax",
            title: "Varoluş ve Yaşam Tanrıçası",
            color: "#f43f5e",
            colorDim: "rgba(244, 63, 94, 0.4)",
            colorGlow: "rgba(244, 63, 94, 0.25)",
            colorBgGlow: "rgba(244, 63, 94, 0.12)",
            img: "img/Tanrılar/Xanax.png",
            story: "Tüm evrenin kalp atışını, canlıların damarlarında akan yaşam enerjisini ve varoluşun sonsuz döngüsünü koruyan Xanax. O, doğumun, büyümenin ve hayatta kalma iradesinin kutsal kaynağıdır. Şifacılar ve yaşam koruyucuları onun sonsuz sevgisinden beslenir.",
            blessing: "Varoluş Özü & Sonsuz Yaşam Işığı",
            effectType: "effect-xanax"
        }
    };

    let currentGodAudio = null;
    const godCards = document.querySelectorAll('.god-card');
    const godModal = document.getElementById('god-modal');
    const godModalImg = document.getElementById('god-modal-img');
    const godModalTitle = document.getElementById('god-modal-title');
    const godModalSubtitle = document.getElementById('god-modal-subtitle');
    const godModalStory = document.getElementById('god-modal-story');
    const godModalBlessingText = document.getElementById('god-modal-blessing-text');
    const godModalClose = document.querySelector('.god-modal-close');
    const godModalDynamicEffects = document.getElementById('god-modal-dynamic-effects');

    if (godCards.length > 0 && godModal) {
        godCards.forEach(card => {
            card.addEventListener('click', () => {
                const godId = card.getAttribute('data-god-id');
                const data = godsData[godId];

                if (data) {
                    // Varsa önceki sesi durdur
                    if (currentGodAudio) {
                        currentGodAudio.pause();
                        currentGodAudio = null;
                    }

                    // Modal İçeriğini Doldur
                    godModalImg.src = data.img;
                    godModalTitle.textContent = data.name;
                    godModalSubtitle.textContent = data.title;
                    godModalStory.textContent = data.story;
                    godModalBlessingText.textContent = data.blessing;

                    // Dinamik CSS Değişkenlerini Ata
                    godModal.style.setProperty('--modal-color', data.color);
                    godModal.style.setProperty('--modal-color-dim', data.colorDim);
                    godModal.style.setProperty('--modal-glow', data.colorGlow);
                    godModal.style.setProperty('--modal-bg-glow', data.colorBgGlow);

                    // Dinamik Efektleri Oluştur
                    godModal.setAttribute('data-effect-type', data.effectType);
                    if (godModalDynamicEffects) {
                        godModalDynamicEffects.innerHTML = ''; // Öncekileri temizle

                        if (data.effectType === 'effect-xanax') {
                            let lights = '<div class="xanax-core"></div>';
                            for (let i = 0; i < 25; i++) {
                                const left = Math.random() * 100;
                                const top = Math.random() * 100;
                                const delay = Math.random() * 3;
                                const duration = 2 + Math.random() * 4;
                                const size = 3 + Math.random() * 8;
                                lights += `<div class="xanax-light" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = lights;
                        } else if (data.effectType === 'effect-miu') {
                            let stars = `
                                <div class="miu-nebula"></div>
                                <div class="miu-shooting-star star-1"></div>
                                <div class="miu-shooting-star star-2"></div>
                            `;
                            for (let i = 0; i < 45; i++) {
                                const left = Math.random() * 100;
                                const top = Math.random() * 100;
                                const delay = Math.random() * 5;
                                const size = 1 + Math.random() * 3;
                                stars += `<div class="miu-star" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = stars;
                        } else if (data.effectType === 'effect-leopolde') {
                            let blackFire = `
                                <div class="leopolde-flame flame-1"></div>
                                <div class="leopolde-flame flame-2"></div>
                            `;
                            for (let i = 0; i < 35; i++) {
                                const left = Math.random() * 100;
                                const delay = Math.random() * 2;
                                const duration = 1.5 + Math.random() * 2.5;
                                const size = 4 + Math.random() * 10;
                                blackFire += `<div class="leopolde-spark" style="left: ${left}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = blackFire;
                        } else if (data.effectType === 'effect-merinos') {
                            let hourglass = `
                                <div class="merinos-hourglass">
                                    <div class="merinos-sand-top"></div>
                                    <div class="merinos-sand-stream"></div>
                                    <div class="merinos-sand-bottom"></div>
                                </div>
                            `;
                            for (let i = 0; i < 30; i++) {
                                const left = Math.random() * 100;
                                const top = Math.random() * 100;
                                const delay = Math.random() * 4;
                                hourglass += `<div class="merinos-time-sand" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = hourglass;
                        } else if (data.effectType === 'effect-magiena') {
                            let arcane = `
                                <div class="magiena-circle circle-1"></div>
                                <div class="magiena-circle circle-2"></div>
                                <div class="magiena-rune rune-1"></div>
                                <div class="magiena-rune rune-2"></div>
                            `;
                            for (let i = 0; i < 20; i++) {
                                const left = Math.random() * 100;
                                const top = Math.random() * 100;
                                const delay = Math.random() * 3;
                                const size = 5 + Math.random() * 10;
                                arcane += `<div class="magiena-orb" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = arcane;
                        } else if (data.effectType === 'effect-malafez') {
                            let volcano = `
                                <div class="malafez-volcano"></div>
                                <div class="malafez-eruption"></div>
                            `;
                            for (let i = 0; i < 30; i++) {
                                const left = 30 + Math.random() * 40;
                                const delay = Math.random() * 2;
                                const duration = 1.5 + Math.random() * 2;
                                const size = 6 + Math.random() * 14;
                                const tx = (Math.random() - 0.5) * 500;
                                volcano += `<div class="malafez-bomb" style="left: ${left}%; width: ${size}px; height: ${size}px; --tx: ${tx}px; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = volcano;
                        } else if (data.effectType === 'effect-simha') {
                            godModalDynamicEffects.innerHTML = `
                                <div class="simha-gear gear-1"></div>
                                <div class="simha-gear gear-2"></div>
                                <div class="simha-gear gear-3"></div>
                                <div class="simha-rune rune-1"></div>
                                <div class="simha-rune rune-2"></div>
                                <div class="simha-rune rune-3"></div>
                            `;
                        } else if (data.effectType === 'effect-emparos') {
                            let nature = `
                                <div class="emparos-tree"></div>
                                <div class="emparos-vine vine-1"></div>
                                <div class="emparos-vine vine-2"></div>
                            `;
                            for (let i = 0; i < 25; i++) {
                                const left = Math.random() * 100;
                                const delay = Math.random() * 4;
                                const duration = 4 + Math.random() * 5;
                                nature += `<div class="emparos-leaf" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = nature;
                        } else if (data.effectType === 'effect-thorgrin') {
                            let forge = `
                                <div class="thorgrin-anvil"></div>
                                <div class="thorgrin-hammer"></div>
                            `;
                            for (let i = 0; i < 35; i++) {
                                const tx = (Math.random() - 0.5) * 500;
                                const ty = (Math.random() - 0.5) * 500;
                                const delay = Math.random() * 2;
                                const duration = 0.8 + Math.random() * 1.2;
                                const size = 4 + Math.random() * 8;
                                forge += `<div class="thorgrin-spark" style="width: ${size}px; height: ${size}px; --tx: ${tx}px; --ty: ${ty}px; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = forge;

                            // Çekiç Sesi Çal
                            currentGodAudio = new Audio('https://actions.google.com/sounds/v1/tools/anvil_hit.ogg');
                            currentGodAudio.volume = 0.7;
                            currentGodAudio.loop = true;
                            currentGodAudio.play().catch(e => console.log('Audio error:', e));
                        } else if (data.effectType === 'effect-casemir') {
                            let beastEffects = `
                                <div class="casemir-demon-eyes"></div>
                                <div class="casemir-rift r-1"></div>
                                <div class="casemir-rift r-2"></div>
                            `;
                            for (let i = 0; i < 12; i++) {
                                const startY = (Math.random() - 0.5) * 400 + 'px';
                                const endY = (Math.random() - 0.5) * 600 + 'px';
                                const delay = Math.random() * 4;
                                const duration = 4 + Math.random() * 3;
                                const scale = 0.6 + Math.random() * 0.7;
                                beastEffects += `<div class="casemir-wyvern" style="top: ${20 + Math.random() * 60}%; --start-y: ${startY}; --end-y: ${endY}; --scale: ${scale}; --flight-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
                            }
                            for (let i = 0; i < 3; i++) {
                                const angle = (Math.random() - 0.5) * 60 + 'deg';
                                const top = 20 + Math.random() * 60;
                                const left = 20 + Math.random() * 50;
                                const delay = Math.random() * 4;
                                beastEffects += `<div class="casemir-giga-slash" style="top: ${top}%; left: ${left}%; --slash-angle: ${angle}; animation-delay: ${delay}s;"></div>`;
                            }
                            for (let i = 0; i < 30; i++) {
                                const tx = (Math.random() - 0.5) * 400 + 'px';
                                const ty = (Math.random() - 0.5) * 400 + 'px';
                                const delay = Math.random() * 2;
                                beastEffects += `<div class="casemir-ember" style="top: ${30 + Math.random() * 40}%; left: ${30 + Math.random() * 40}%; --tx: ${tx}; --ty: ${ty}; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = beastEffects;

                            // Canavar / İblis Kükremesi & Boss Müziği Atmosferi
                            currentGodAudio = new Audio('https://actions.google.com/sounds/v1/horror/monster_snort.ogg');
                            currentGodAudio.volume = 0.9;
                            currentGodAudio.loop = true;
                            currentGodAudio.play().catch(e => console.log('Audio error:', e));
                        } else if (data.effectType === 'effect-osentha') {
                            let shadowEffects = `
                                <div class="osentha-vortex"></div>
                            `;
                            for (let i = 0; i < 15; i++) {
                                const left = Math.random() * 90;
                                const driftX = (Math.random() - 0.5) * 300 + 'px';
                                const delay = Math.random() * 5;
                                const duration = 6 + Math.random() * 4;
                                const scale = 0.6 + Math.random() * 0.6;
                                shadowEffects += `<div class="osentha-lost-soul" style="left: ${left}%; --drift-x: ${driftX}; --scale: ${scale}; --ascend-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
                            }
                            for (let i = 0; i < 35; i++) {
                                const left = Math.random() * 100;
                                const delay = Math.random() * 4;
                                const duration = 2 + Math.random() * 3;
                                shadowEffects += `<div class="osentha-tear" style="left: ${left}%; --drop-duration: ${duration}s; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = shadowEffects;

                            // Kayıp Ruhlar / Göksel Koro Ağıtı
                            currentGodAudio = new Audio('https://actions.google.com/sounds/v1/ambiences/ethereal_choir.ogg');
                            currentGodAudio.volume = 0.7;
                            currentGodAudio.loop = true;
                            currentGodAudio.play().catch(e => console.log('Audio error:', e));
                        } else if (data.effectType === 'effect-vespadora') {
                            let genesisEffects = `
                                <div class="vespadora-mandala"></div>
                                <div class="vespadora-beam" style="left: 20%; --beam-angle: -15deg; animation-delay: 0s;"></div>
                                <div class="vespadora-beam" style="left: 50%; --beam-angle: 0deg; animation-delay: 2s;"></div>
                                <div class="vespadora-beam" style="right: 20%; --beam-angle: 15deg; animation-delay: 4s;"></div>
                            `;
                            for (let i = 0; i < 16; i++) {
                                const startX = (Math.random() - 0.5) * 200 + 'px';
                                const startY = (Math.random() - 0.5) * 200 + 'px';
                                const endX = (Math.random() - 0.5) * 800 + 'px';
                                const endY = (Math.random() - 0.5) * 800 + 'px';
                                const delay = Math.random() * 4;
                                const duration = 6 + Math.random() * 6;
                                const scale = 0.6 + Math.random() * 0.8;
                                genesisEffects += `
                                    <div class="vespadora-sacred-butterfly" style="left: ${20 + Math.random() * 60}%; top: ${20 + Math.random() * 60}%; --start-x: ${startX}; --start-y: ${startY}; --end-x: ${endX}; --end-y: ${endY}; --scale: ${scale}; --fly-duration: ${duration}s; animation-delay: ${delay}s;">
                                        <div class="wing left"></div>
                                        <div class="wing right"></div>
                                    </div>
                                `;
                            }
                            for (let i = 0; i < 30; i++) {
                                const left = Math.random() * 100;
                                const top = Math.random() * 100;
                                const delay = Math.random() * 3;
                                genesisEffects += `<div class="vespadora-dust" style="left: ${left}%; top: ${top}%; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = genesisEffects;

                            // Kutsal / Yaratılış Atmosfer Sesi
                            currentGodAudio = new Audio('https://actions.google.com/sounds/v1/science_fiction/sci_fi_hum.ogg');
                            currentGodAudio.volume = 0.6;
                            currentGodAudio.loop = true;
                            currentGodAudio.play().catch(e => console.log('Audio error:', e));
                        } else if (data.effectType === 'effect-warnar') {
                            let war = `
                                <div class="warnar-banner banner-left"></div>
                                <div class="warnar-banner banner-right"></div>
                            `;
                            for (let i = 0; i < 30; i++) {
                                const left = Math.random() * 100;
                                const top = Math.random() * 100;
                                const delay = Math.random() * 3;
                                const size = 4 + Math.random() * 8;
                                war += `<div class="warnar-aura" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s;"></div>`;
                            }
                            godModalDynamicEffects.innerHTML = war;

                            // Kurt/Savaş Uluması Sesi Çal
                            currentGodAudio = new Audio('https://actions.google.com/sounds/v1/animals/wolf_howl.ogg');
                            currentGodAudio.volume = 0.8;
                            currentGodAudio.play().catch(e => console.log('Audio error:', e));
                        } else if (data.effectType === 'effect-x') {
                            godModalDynamicEffects.innerHTML = `
                                <div class="x-question q-1">???</div>
                                <div class="x-question q-2">???</div>
                                <div class="x-question q-3">???</div>
                                <div class="x-question q-4">???</div>
                            `;
                        }
                    }

                    // Modalı Aç
                    godModal.classList.add('active');
                }
            });
        });

        // Modalı Kapatma İşlemleri
        const closeModal = () => {
            godModal.classList.remove('active');
            if (currentGodAudio) {
                currentGodAudio.pause();
                currentGodAudio = null;
            }
        };

        if (godModalClose) {
            godModalClose.addEventListener('click', closeModal);
        }

        godModal.addEventListener('click', (e) => {
            if (e.target === godModal) {
                closeModal();
            }
        });

        // ESC tuşu ile kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && godModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // --- BÜYÜ VE SAVAŞ AKADEMİSİ (Filtreleme & Parşömen Modali) ---
    const filterBtns = document.querySelectorAll('.academy-filter-btn');
    const academyCards = document.querySelectorAll('.academy-card');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');

                const allCards = document.querySelectorAll('.academy-card');
                allCards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-category') === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // --- AKADEMİ EFSANEVİ 60 DERS VERİTABANI & SAYFA ÇEVİRME SİSTEMİ ---
    let currentBookKey = null;
    let currentBookPage = 0;
    let bookAudio = null;

    const academyCourses = [
        // --- 1. KADİM BÜYÜ (MAGIC) - 10 DERS ---
        {
            id: "magic1", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Temel Rünik Rezonans & Mana Yönlendirme",
            master: "Üstat Magıena",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Zihinsel odaklanma ile havadaki serbest manayı toplama, temel koruma rünleri çizme ve basit enerji akışları oluşturma rehberi.",
            intro: `Büyü sanatına atılan ilk adım, zihnin kibrinden arınmasıdır. Havadaki serbest mana, sadece onu saygıyla çağıran bir zihne itaat eder. Magıena'nın ilk kuralı şudur: "Manayı zorlama, onunla ak."`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Çevresel Manayı Algılama</h4>
                    <p>Gözlerinizi kapatın ve etrafınızdaki havanın sıcaklık değişimlerine odaklanın. Teninizde karıncalanma hissettiğiniz an, odadaki serbest mananın akış yönünü buldunuz demektir. Bu akışı soluk borunuzdan geçirerek ciğerlerinize değil, doğrudan astral merkezinize çekmelisiniz.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Temel Koruma Rünü (Aethel) Çizimi</h4>
                    <p>Sağ elinizin işaret parmağıyla havada dikey bir yarım ay çizin ve ortasından yatay bir çizgiyle kesin. Çizgi boyunca mavi bir kıvılcım kalıyorsa rün mühürlenmiştir. Bu temel kalkan, zayıf fiziksel saldırıları ve serseri büyü oklarını sönümleyecektir.</p>
                </div>`
            ]
        },
        {
            id: "magic2", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Kıvılcım Çağırma & Büyülü Işık Küreleri",
            master: "Üstat Magıena",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Karanlık zindanları aydınlatmak ve zayıf yaratıkları kör etmek için avuç içinde kalıcı ışık küreleri sentezleme sanatı.",
            intro: `Karanlıktan korkan bir büyücü, kendi gölgesinin esiri olur. Avucunuzda doğacak ilk ışık, güneşin değil, kendi ruhunuzun yansımasıdır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Avuç İçi Isı Odaklaması</h4>
                    <p>Avuçlarınızı birbirine sürterek fiziksel bir ısı oluşturun, ardından bu ısıyı zihinsel bir imgeyle besleyin. Parmak uçlarınızdan süzülen sarımsı mana akıntıları avucunuzun tam ortasında birleşmelidir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Küreyi Sabitleme ve Fırlatma</h4>
                    <p>Oluşan ışık küresi sabitlenmezse saniyeler içinde dağılır. Kürenin etrafına zihinsel bir çember çizerek onu mühürleyin. Artık bu ışığı zindan tavanına asabilir veya karanlıkta pusu kuran goblinlerin gözlerine fırlatabilirsiniz.</p>
                </div>`
            ]
        },
        {
            id: "magic3", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Elementel Uyum & Akışkan Alev Kırbaçları",
            master: "Üstat Magıena",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-fire"></i> Orta Seviye',
            desc: "Ateş elementinin dengesiz doğasını zapt ederek, düşmanı uzaktan saran ve zırhları eriten alev kırbaçları oluşturma.",
            intro: `Ateş bir efendi değil, sadık bir hizmetkardır. Ancak dizginleri gevşetirseniz, önce sahibini yakar. Magıena'nın kırbacı asla hedefini şaşmaz.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ateşin Kinetik Yönlendirmesi</h4>
                    <p>Alev kırbacı oluşturmak için saf manayı yüksek sürtünme katsayısıyla titreştirmeniz gerekir. Kollarınızı birer sarkaç gibi savurarak havadaki oksijeni manayla tutuşturun.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kırbacın Menzili ve Yakma Gücü</h4>
                    <p>Kırbacın uzunluğu zihinsel odaklanmanıza bağlıdır. Usta bir büyücü, 10 metre ötedeki bir şövalyenin kılıcını kırbaçla sarıp elinden sökebilir ve zırhının eklem yerlerini saniyeler içinde eritebilir.</p>
                </div>`
            ]
        },
        {
            id: "magic4", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Buzdan Mızraklar & Dondurucu Rüzgarlar",
            master: "Üstat Magıena",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-icicles"></i> Orta Seviye',
            desc: "Havadaki nemi anında kristalleştirerek düşman hatlarına saplanan keskin buz mızrakları ve yavaşlatıcı rüzgarlar çağırma.",
            intro: `Soğuk, hareketin ve zamanın durduğu nihai huzur noktasıdır. Düşmanınızın kalbindeki ateşi söndürmek için önce kendi kanınızı buz gibi soğutmalısınız.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Nem Yoğunlaştırma ve Kristalizasyon</h4>
                    <p>Çevredeki su buharını avuçlarınızın arasında sıkıştırın. Sıcaklığı mutlak sıfıra yaklaştırarak suyu saniyeler içinde jilet keskinliğinde buz sarkıtlarına dönüştürün.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Hedefleme ve Zırh Delme Oranı</h4>
                    <p>Buz mızrağı fırlatıldığında havada ıslık çalar. Doğru açıyla fırlatılan bir mızrak, deri zırhları ve tahta kalkanları rahatlıkla delip geçer, hedefin kan akışını yavaşlatır.</p>
                </div>`
            ]
        },
        {
            id: "magic5", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Boyut Kapıları & Kısa Mesafe Işınlanma",
            master: "Üstat Magıena",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Uzay-zaman dokusunu geçici olarak bükerek savaş alanında anlık yer değiştirme ve pusu kurma teknikleri.",
            intro: `Mesafe, sadece yürümek zorunda olanların inandığı bir illüzyondur. Uzay bükülebilir bir kumaştır; iki noktayı üst üste katladığınızda yolculuk biter.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Uzay Dokusunda Yırtık Açma (Blink)</h4>
                    <p>Gözünüzün gördüğü ve zihninizin net olarak haritalandırdığı bir noktaya odaklanın. Vücudunuzun frekansını astral düzleme yükselterek fiziksel engellerin içinden süzülün.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Işınlanma Sonrası Oryantasyon</h4>
                    <p>Işınlanma (Blink) anında iç organlar geçici bir basınç yaşar. Hedef noktaya varıldığında anında denge kuramayan bir büyücü, düşmanın kılıcının üzerine düşebilir. Bu yüzden çıkış noktasında daima dizler bükük olmalıdır.</p>
                </div>`
            ]
        },
        {
            id: "magic6", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Telekinezi & Çevresel Nesne Manipülasyonu",
            master: "Üstat Magıena",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Zihin gücüyle ağır nesneleri, düşman silahlarını ve kayaları havalandırıp mermi gibi fırlatma sanatı.",
            intro: `Zihin, kaslardan çok daha güçlü bir kaldıraçtır. Dünyayı ellerinizle değil, düşüncelerinizin ağırlığıyla yerinden oynatın.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Yerçekimi Bağlarını Koparma</h4>
                    <p>Hedef nesnenin ağırlık merkezine zihinsel kancalar atın. Yerçekimi kuvvetinin tam zıddı yönünde bir mana vektörü uygulayarak nesneyi yavaşça yerden kesin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Çoklu Nesne Kontrolü (Kinetic Storm)</h4>
                    <p>İleri seviyede etrafınızdaki onlarca kılıcı, kayayı ve enkaz parçasını aynı anda yörüngenizde döndürebilir ve bunları tek bir el işaretiyle hedefe mermi yağmuru gibi indirebilirsiniz.</p>
                </div>`
            ]
        },
        {
            id: "magic7", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Gök gürültüsü Çağrısı & Zincirleme Yıldırımlar",
            master: "Üstat Magıena",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Gökyüzündeki elektrik yüklü bulutları savaş alanına indirerek müttefikten müttefike atlayan ölümcül yıldırımlar çağırma.",
            intro: `Yıldırım, gökyüzünün yeryüzüne indirdiği en saf ve acımasız öfkedir. Onu parmak uçlarınızdan serbest bıraktığınızda, kulakları sağır eden bir zafer çığlığı duyacaksınız.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. İyonizasyon ve Atmosferik Yükleme</h4>
                    <p>Havadaki elektrik yükünü parmak uçlarınızda toplayın. Gökyüzündeki fırtına bulutlarıyla aranızda dikey bir iyon kanalı açarak ilk yıldırımı bedeninize çekin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Zincirleme Sıçrama Algoritması</h4>
                    <p>İlk hedefe çarpan yıldırım, en yakınındaki metal zırhlı diğer düşmanlara sekerek ilerler. Bu büyü, özellikle sıkışık kalkan duvarlarını saniyeler içinde kül etmek için tasarlanmıştır.</p>
                </div>`
            ]
        },
        {
            id: "magic8", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Zaman Yavaşlatma & Krono-Büküm Alanları",
            master: "Üstat Magıena",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Belirli bir çap içindeki zaman akışını yüzde yetmiş oranında yavaşlatarak düşman oklarından ve kılıç darbelerinden kaçınma.",
            intro: `Zaman, herkes için aynı hızda akan bir nehir değildir. Usta bir büyücü, o nehrin önüne zihinsel bir baraj kurarak akışı damla damla kontrol edebilir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Krono-Alan Küresi Oluşturma</h4>
                    <p>Etrafınızda 5 metre çapında şeffaf, morumsu bir küre oluşturun. Bu kürenin içine giren her türlü harici kinetik nesne (oklar, kılıçlar, düşmanlar) yoğun bir melasın içindeymiş gibi yavaşlar.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Taktiksel Avantaj ve Dezavantajlar</h4>
                    <p>Alan içindeyken siz normal hızınızda hareket edersiniz. Havada yavaşlamış okların yönünü değiştirebilir veya düşmanın açık bıraktığı boynuna kılıcınızı sakince yerleştirebilirsiniz. Ancak bu büyü muazzam bir mana tüketir.</p>
                </div>`
            ]
        },
        {
            id: "magic9", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Gölge Hükümdarlığı & Astral Ruh Çağırma",
            master: "Tanrıça Osentha",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Zindanların ve sürgünlerin karanlık enerjisini kullanarak kayıp ruhları yönlendirme ve boyutlar arası gölge bariyerleri oluşturma.",
            intro: `Karanlık, bilgisizlerin sandığı gibi bir kötülük yuvası değil; terkedilmişlerin, unutulmuşların ve sürgünlerin sessiz sığınağıdır. Osentha'nın fısıltısını duyanlar, gecenin en zifiri tonunu bir zırh gibi kuşanırlar.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Sürgünlerin ve Kayıp Ruhların Fısıltısı</h4>
                    <p>Osentha'nın öğretisi, karanlığı bir korku unsuru olarak değil, şefkatli bir örtü olarak kucaklamaktır. Zindanlarda ve sürgünde ölenlerin kayıp ruhları, doğru frekansla çağrıldığında aşılmaz bir gölge kalkanına dönüşür.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Gölge Bariyerleri ve Astral Gizlilik</h4>
                    <p>Bu ilmi öğrenen bir büyücü, kendi fiziksel varlığını gölgelerin içine gömerek düşmanların algısından tamamen silinebilir ve kayıp ruhları birer gözcü olarak diyarın dört bir yanına gönderebilir.</p>
                </div>`
            ]
        },
        {
            id: "magic10", category: "magic", badgeClass: "magic",
            badge: '<i class="fa-solid fa-wand-magic-sparkles"></i> Kadim Büyü',
            title: "Kozmik Çöküş & Kara Delik Sentezi",
            master: "Üstat Magıena",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Savaş alanının tam kalbinde yerçekimini sonsuzluğa bükerek tüm düşmanları ve yapıları yutan minyatür bir kara delik açma.",
            intro: `Her şeyin başladığı bir nokta olduğu gibi, her şeyin son bulacağı mutlak bir hiçlik de vardır. Magıena'nın avucunda açılan hiçlik, evrenin en karanlık sırrıdır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Noktasal Tekillik (Singularity) Yaratma</h4>
                    <p>İki elinizin parmaklarını birbirine kenetleyerek uzay dokusunda mikroskobik bir yırtık açın. Bu yırtığı milyarlarca tonluk zihinsel basınçla sıkıştırarak mutlak bir çekim merkezi oluşturun.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Olay Ufku ve Yutma Kapasitesi</h4>
                    <p>Oluşan minyatür kara delik, etrafındaki her şeyi (ışığı, sesi, zırhlı birlikleri, binaları) merkezine doğru çeker ve atomlarına ayırır. Bu büyü kontrol edilemezse, açan büyücüyü de yutabilir.</p>
                </div>`
            ]
        },

        // --- 2. SAVAŞ SANATLARI (COMBAT) - 10 DERS ---
        {
            id: "combat1", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Piyade Savaş Düzeni & Kalkan Duvarı",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Savaş alanında omuz omuza çarpışan piyadelerin kalkan duvarı oluşturma, dayanıklılık artırma ve düşman hatlarını yarma taktikleri.",
            intro: `Tek bir savaşçı bir kayadır; omuz omuza vermiş bin savaşçı ise aşılmaz bir dağdır. Warnar'ın orduları, bireysel kahramanlıklarla değil, mutlak disiplin ve çelikten bir kalkan duvarıyla zafer kazanır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Omuz Omuza Kenetlenme Felsefesi</h4>
                    <p>Kalkanınız sadece sizi değil, solunuzdaki kardeşinizi de korur. Kalkan duvarında açılacak tek bir gedik, tüm hattın çökmesine yol açar. Ayaklarınızı toprağa kök salmış ağaçlar gibi sağlam basmalı ve gelen darbeyi tüm vücudunuzla karşılamalısınız.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Düşman Hattını Yarma Taktikleri</h4>
                    <p>Düşman kalkan duvarına çarptığı anda, arka sıradaki mızraklılar kalkanların üzerinden senkronize hamleler yapmalıdır. Bu ritmik baskı, düşman saflarında panik yaratır ve hattı ortadan ikiye yarar.</p>
                </div>`
            ]
        },
        {
            id: "combat2", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Temel Kılıç Savuşturma & Karşı Saldırı",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Gelen kılıç darbelerini bıçağın açısını kullanarak sönümleme ve düşmanın dengesini bozarak ölümcül bir karşı hamle yapma.",
            intro: `Savaşta en büyük hata, gelen güce kaba kuvvetle karşı koymaktır. Düşmanının kılıcını bir nehir gibi yönlendir ve kendi ivmesiyle onu boğ.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Bıçağın Açısı (Parry)</h4>
                    <p>Düşman kılıcı indiğinde kalkanınızı veya kılıcınızın siperliğini 45 derecelik açıyla tutun. Doğrudan durdurmak yerine darbeyi yana kaydırarak düşmanın ağırlık merkezini öne düşürün.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Riposte (Karşı Hamle)</h4>
                    <p>Düşman dengesini kaybedip öne sendelediği o yarım saniyelik aralıkta, kılıcınızın ucunu doğrudan boyun veya koltuk altı gibi zırhsız bölgelere saplayın. Hız, kaba kuvvetten daima üstündür.</p>
                </div>`
            ]
        },
        {
            id: "combat3", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Çift Bıçak Dansı & Çevik Manevralar",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-running"></i> Orta Seviye',
            desc: "Ağır zırhları terk ederek hız ve refleks odaklı çift hançer kullanımı, düşmanın arkasına sarkma ve sinir noktalarını kesme.",
            intro: `Gölge gibi hareket eden bir savaşçıyı hiçbir kalkan durduramaz. Rüzgarı kesemezsiniz; rüzgarın kendisi olun.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ağırlık Merkezini Düşürme</h4>
                    <p>Dizlerinizi bükün ve adımlarınızı parmak uçlarınızda atın. Çift hançer kullanırken kollarınız bir akrebin kıskaçları gibi sürekli hareket halinde ve esnek olmalıdır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Sinir Kesiği Teknikleri</h4>
                    <p>Hedefiniz düşmanın kalın göğüs zırhı değil; diz ardı tendonları, bilek sinirleri ve boyun damarlarıdır. Düşmanın etrafında dönerek onu yavaşlatın ve kan kaybından düşmesini izleyin.</p>
                </div>`
            ]
        },
        {
            id: "combat4", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Arbalet Ustalığı & Keskin Nişancılık",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-crosshairs"></i> Orta Seviye',
            desc: "Ağır kurmalı arbaletlerle uzaktan zırh delme, rüzgar hızını hesaplama ve hareketli hedefleri tek atışta indirme.",
            intro: `Savaş alanında en korkutucu ses, çekilen bir kılıç değil; tetiği düşen bir arbaletin çıkardığı o kuru ve ölümcül tık sesidir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Nefes Kontrolü ve Tetik Düşürme</h4>
                    <p>Arbaleti omzunuza dayadığınızda kalp atışlarınızı dinleyin. İki nefes arasındaki o sessiz boşlukta tetiği ezerek düşürün. Sarsıntısız bir atış, hedefin tam kalbini bulacaktır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Zırh Delici Uçlar (Bodkin)</h4>
                    <p>Çelik zırhlı şövalyeleri durdurmak için geniş av uçları değil, ağır ve iğne gibi sivri Bodkin okları kullanmalısınız. Bu oklar zincir zırhların halkalarını saniyeler içinde yarar.</p>
                </div>`
            ]
        },
        {
            id: "combat5", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Mızrak Duvarı & Süvari Durdurma Taktikleri",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Uzun kargılarla sıkışık falanks düzeni alarak, dört nala gelen ağır zırhlı süvari birliklerini duvara çarpmışa çevirme.",
            intro: `Atlar akıllıdır; ölümün üzerine koşmazlar. Karşılarında çelikten bir diken tarlası gören hiçbir süvari birliği o hattı bozamaz.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kargıyı Toprağa Saplama (Bracing)</h4>
                    <p>4 metrelik kargınızın arka ucunu toprağa kazdığınız küçük bir çukura dayayın ve ayağınızla sabitleyin. Mızrağın ucunu atın göğüs hizasına yönlendirin. Çarpışmanın ivmesini kollarınız değil, toprak emecektir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Falanks Disiplini</h4>
                    <p>Süvari üzerinize gelirken asla gözlerinizi kırpmayın veya hattı bozup kaçmayın. Falanks düzenindeki piyadeler birbirine o kadar yakın durmalıdır ki, atlar aradan geçebilecek hiçbir boşluk bulamasın.</p>
                </div>`
            ]
        },
        {
            id: "combat6", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Savaş Çekici & Zırh Parçalama Teknikleri",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Ağır gürzler ve savaş çekiçleriyle plaka zırhların içindeki kemikleri kırma ve kalkanları tek darbede ezme.",
            intro: `Kılıç zırhı kesemezse çaresiz kalır. Ancak bir çekiç için zırhın hiçbir önemi yoktur; o doğrudan içerideki bedeni ezer.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kinetik Şok İletimi</h4>
                    <p>Çekicin ucundaki sivri gaga kısmını (Lucerne) düşmanın kaskına veya göğüs plakasına indirin. Zırh delinmese bile içeriye aktarılan muazzam kinetik şok dalgası, düşmanın kaburgalarını ve kafatasını çatlatacaktır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kalkan Kırma Hamlesi</h4>
                    <p>Düşman kalkanını kaldırdığında çekicin ağır yassı kısmıyla kalkanın tam merkezine vurun. Bu darbe düşmanın kolunu uyuşturacak ve kalkanı bir daha kullanamayacak şekilde parçalayacaktır.</p>
                </div>`
            ]
        },
        {
            id: "combat7", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Ağır Kılıç Ustalığı & Giga-Slash Teknikleri",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Düşman zırhlarını ve kalkanlarını tek hamlede parçalamak için fiziksel gücü alev aurasıyla birleştirme sanatı.",
            intro: `Silahın ağırlığı zayıflar için bir yüktür; gerçek bir usta içinse yerçekiminin sunduğu muazzam bir lütuftur. Warnar'ın kılıcı kalktığında, gök gürler; indiğinde ise dağlar yarılır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Mutlak Fiziksel Güç ve Alev Aurası</h4>
                    <p>Savaş Tanrısı Warnar'ın öğretisinin temeli, silahın ağırlığını bir yük olarak değil, vücudun doğal bir uzantısı olarak görmektir. Giga-Slash tekniği, sadece kol gücüyle yapılmaz; bacaklardan başlayan, omurgadan tırmanan ve kılıcın ucundan patlayan muazzam bir kinetik enerji boşalmasıdır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Düşman Zırhını Tek Hamlede Parçalama</h4>
                    <p>Kılıcın keskin ucuna savaş aurası yüklendiğinde, etrafında kızıl bir şok dalgası oluşur. Bu dalga, en sert ejderha pulu zırhları veya efsanevi kalkanları bile kağıt gibi yırtacak titreşime ulaşır.</p>
                </div>`
            ]
        },
        {
            id: "combat8", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Gölge Adımları & Kör Nokta Suikastları",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Savaş alanındaki toz bulutlarını ve ışık oyunlarını kullanarak düşmanın görüş açısından anında çıkma ve ölümcül arkadan saldırı.",
            intro: `En tehlikeli darbe, düşmanın nereden geldiğini göremediği darbedir. Savaş sadece güçle değil, kurnazlık ve aldatmacayla kazanılır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Çevresel Görüşü Aldatma</h4>
                    <p>Düşmanın gözlerine doğru sahte bir hamle yapın. O kalkanını yüzüne doğru kaldırıp görüşünü kapattığı o kısacık anda, hızla sol çaprazına kayarak kör noktasına yerleşin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Omurga ve Böbrek Kesiği</h4>
                    <p>Kör noktaya yerleştiğiniz an hançerinizi veya kısa kılıcınızı doğrudan zırhın birleşme yerlerinden böbreklere veya omurilik soğanına saplayın. Sessiz, kesin ve ölümcül.</p>
                </div>`
            ]
        },
        {
            id: "combat9", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Savaş Çılgınlığı & Acı Bastırma (Berserker)",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Damarlardaki adrenalini ilkel bir öfkeye dönüştürerek ölümcül yaralar alsa bile savaşmaya devam etme sanatı.",
            intro: `Acı, sadece zihnin bedene söylediği bir yalandır. Gerçek bir Berserker, kendi kanının kokusuyla sarhoş olur ve ölüm meleği bile onu durduramaz.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. İlkel Öfkeyi Tetikleme</h4>
                    <p>Zihninizdeki tüm korku, şüphe ve kendini koruma güdülerini kapatın. Kalbinizin atışını bir savaş davulu gibi hissederek bilincinizi saf bir hayatta kalma ve yok etme makinesine dönüştürün.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Hasar Emilimi ve Kesintisiz Saldırı</h4>
                    <p>Bu duruma giren bir savaşçı, vücuduna oklar saplansa veya kılıç darbeleri alsa bile acı hissetmez. Vücudu iflas edene kadar insanüstü bir güçle kılıç savurmaya devam eder. Savaş bittiğinde ise derin bir komaya girebilir.</p>
                </div>`
            ]
        },
        {
            id: "combat10", category: "combat", badgeClass: "combat",
            badge: '<i class="fa-solid fa-khanda"></i> Savaş Sanatları',
            title: "Tanrısal Savaş Aurası & Ordu Çökerten Hamle",
            master: "Savaş Tanrısı Warnar",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Savaş Tanrısı Warnar'ın mutlak aurasını kuşanarak tek bir kılıç savuruşuyla yüzlerce piyadeyi havaya uçurma sanatı.",
            intro: `Bir ordunun karşısına tek başına çıkmak delilik değildir; eğer damarlarında Warnar'ın kudreti akıyorsa, o ordu için bir katliamdır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kinetik Savaş Aurası Yüklemesi</h4>
                    <p>Kılıcınızı gökyüzüne kaldırın ve bedeninize muazzam bir kozmik savaş enerjisi çekin. Etrafınızdaki toprak titremeye ve küçük taşlar havaya kalkmaya başladığında aura doygunluğa ulaşmıştır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Yıkıcı Şok Dalgası (Earth-Shatter)</h4>
                    <p>Kılıcınızı tüm gücünüzle toprağa indirin. Bıçağın ucundan patlayan kızıl kinetik şok dalgası, önünüzdeki 100 metrelik hat boyunca toprağı yaracak ve yüzlerce düşman askerini havaya fırlatacaktır.</p>
                </div>`
            ]
        },

        // --- 3. ŞİFA İLİMLERİ (HEALING) - 10 DERS ---
        {
            id: "healing1", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Temel İlk Yardım & Kanama Durdurma",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Savaş alanında açılan derin kılıç yaralarını ve ok deliklerini temizleme, bitkisel merhemlerle kanamayı anında kesme.",
            intro: `Şifa, merhametle başlar. Kan kaybeden bir yoldaşın başında panikleyen bir zihin, ölümün en büyük yardımcısıdır. Sakin ol ve ellerini yaraya bastır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Yaranın Temizlenmesi ve Basınç</h4>
                    <p>Yaradaki zırh parçalarını ve kirleri temiz suyla yıkayın. Ardından temiz bir bez veya parşömen parçasıyla atardamarın üzerine güçlü bir fiziksel basınç uygulayarak kan akışını yavaşlatın.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Yosun Merhemi Uygulaması</h4>
                    <p>Kadim meşe ağaçlarının gövdesinden toplanan 'Kan Tutan Yosunu' ezerek yaranın içine sürün. Bu yosun saniyeler içinde pıhtılaşma sağlayarak enfeksiyon riskini sıfıra indirecektir.</p>
                </div>`
            ]
        },
        {
            id: "healing2", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Arındırıcı Çaylar & Zehir Temizleme",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Engerek zehirlerini, goblin bıçaklarındaki pası ve çürütücü kimyasalları vücuttan atan şifalı bitki demleme teknikleri.",
            intro: `Zehir, karanlıkta işleyen sinsi bir bıçaktır. Doğanın eczanesinde her zehrin bir panzehiri mutlaka toprağın altında uyumaktadır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Zehrin Teşhisi ve Semptomlar</h4>
                    <p>Hastanın göz bebeklerine ve damar renklerine bakın. Damarlar morarıyorsa yılan zehri, siyahlaşıyorsa nekrotik bir büyü zehridir. Teşhis ne kadar hızlıysa, yaşam şansı o kadar yüksektir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Gümüş Yaprak Demlemesi</h4>
                    <p>Gümüş Yaprak otunu kaynar suyla demleyip hastaya içirin. Bu çay, midedeki ve kandaki toksinleri bağlayarak ter ve kusma yoluyla vücuttan hızla atılmasını sağlar.</p>
                </div>`
            ]
        },
        {
            id: "healing3", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Kırık Sarma & Kemik Kaynatma İlimi",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-bone"></i> Orta Seviye',
            desc: "Savaş çekiçleriyle parçalanmış kemikleri doğru açıyla hizalama ve kadim doğa manasıyla kaynama sürecini hızlandırma.",
            intro: `Kemik bedenin iskelesidir. İskelet çökürse, ruh o binada daha fazla barınamaz. Emparos'un dokunuşu, kırılanı eskisinden daha sağlam yapar.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Traksiyon ve Kemik Hizalama</h4>
                    <p>Kırılmış uzvu yavaşça ama kararlı bir güçle çekerek kemik uçlarını tam olarak karşı karşıya getirin. Hastanın acıdan bayılmasını önlemek için öncesinde uyuşturucu söğüt kabuğu çiğnetin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kalsiyum Rezonansı ve Atel</h4>
                    <p>Hizalanan kemiğin etrafına yeşil mana akıtarak osteoblast hücrelerini uyarın. İki ahşap atel ile sabitlediğiniz kemik, normalde aylar sürecek kaynama sürecini 3 gün içinde tamamlayacaktır.</p>
                </div>`
            ]
        },
        {
            id: "healing4", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Güneş Işığı Terapisi & Moral Desteği",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-sun"></i> Orta Seviye',
            desc: "Karanlık zindanlarda ruhu daralmış ve umudunu kaybetmiş savaşçılara saf güneş enerjisi ve zihinsel dinginlik aktarma.",
            intro: `Karanlık sadece bedeni değil, umudu da çürütür. Bir savaşçının kalbindeki ışık söndüğünde, kılıcını kaldıracak gücü bulamaz.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Solar Mana Depolama</h4>
                    <p>Gündüz vakti güneşin en tepede olduğu anlarda avuçlarınızda saf foton enerjisi biriktirin. Bu enerjiyi zihinsel bir prizmadan geçirerek ılık, altın sarısı bir auraya dönüştürün.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Aura Aktarımı ve Zihinsel Şifa</h4>
                    <p>Depoladığınız güneş aurasını travma geçirmiş veya depresyondaki savaşçının alnına dokunarak aktarın. Bu enerji, zihindeki karanlık fısıltıları susturur ve yaşama sevincini geri getirir.</p>
                </div>`
            ]
        },
        {
            id: "healing5", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Doğa Ruhlarıyla Rezonans & Toprak Kalkanı",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Ormanın derinliklerindeki kadim ruhlarla bağ kurarak aşılmaz doğa bariyerleri ve sarmaşık kalkanları çağırma rehberi.",
            intro: `Orman sessizdir ama asla savunmasız değildir. Ağaçların kökleri toprağın hafızasını taşır. Emparos'un rahipleri, tehlike anında bu kadim hafızayı uyandırarak doğayı uyanık bir muhafıza dönüştürürler.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ormanın Kadim Koruyucularını Çağırma</h4>
                    <p>Doğa, sadece pasif bir şifa kaynağı değil; gerektiğinde en vahşi savunma mekanizmasıdır. Emparos rahipleri, tehlike anında ulu ağaçların ve kadim toprak ruhlarının fısıltısını dinleyerek onları fiziksel birer kalkana dönüştürebilirler.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Sarmaşık Duvarları ve Aşılmaz Bariyerler</h4>
                    <p>Toprağa fısıldanan kadim doğa rünleri, saniyeler içinde elmas sertliğinde sarmaşık duvarları ve devasa kök bariyerleri oluşturur. Bu kalkanlar, en ağır kuşatma silahlarını bile durduracak kudretindedir.</p>
                </div>`
            ]
        },
        {
            id: "healing6", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Grup Şifa Aurası & Alan İyileştirmesi",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Savaş alanında etrafınızdaki 15 metrelik çember içindeki tüm müttefiklerin yaralarını aynı anda kapatan şifa dalgaları yayma.",
            intro: `Tek bir yoldaşı kurtarmak yetmez; savaş alanında zafer, ayakta kalanların sayısıyla ölçülür. Şifanı bir yağmur gibi herkese yağdır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Çevresel Mana Genişlemesi (Tranquility)</h4>
                    <p>Kollarınızı iki yana açarak topraktan aldığınız yaşam enerjisini etrafınızda devasa yeşil bir hale şeklinde genişletin. Çemberin içine giren her müttefik bu şifalı auradan faydalanır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Eşzamanlı Yara Onarımı</h4>
                    <p>Aura içindeki savaşçıların açık yaraları gözle görülür bir hızla kapanır, yorgun kasları enerjiyle dolar. Ancak bu büyü şifacıyı hareketsiz (channeling) bırakır ve savunmasız kılar.</p>
                </div>`
            ]
        },
        {
            id: "healing7", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Nekroz Arındırma & Kara Büyü Bozma",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Lich'lerin ve karanlık büyücülerin bıraktığı çürütücü nekrotik lanetleri ve ölümcül veba dokularını saf yaşam manasıyla yakma.",
            intro: `Kara büyü, bedeni canlı canlı çürüten bir kanserdir. Onu söküp atmak için bazen şifacının da bir bıçak kadar keskin ve acımasız olması gerekir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Nekrotik Doku Tespiti ve İzolasyon</h4>
                    <p>Çürüyen ve siyahlaşan etin etrafına saf gümüş manayla bir bariyer çekerek lanetin sağlıklı organlara yayılmasını durdurun. Bu işlem hastada muazzam bir yanma hissi yaratır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kutsal Işıkla Purifikasyon</h4>
                    <p>Bariyer içindeki nekrotik dokuyu yoğunlaştırılmış doğa ışığıyla buharlaştırın. Kalan boşluğu ise kök hücre uyarımıyla yeniden et ve damar dokusuyla doldurun.</p>
                </div>`
            ]
        },
        {
            id: "healing8", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Koma Uyanışı & Ruh Çağırma Terapisi",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Ağır travma sonucu bilinci astral düzlemde kaybolmuş ve komaya girmiş savaşçıların ruhlarını bedenlerine geri çağırma.",
            intro: `Beden nefes alıyor olabilir, ancak ruh o bedeni terk etmişse geriye sadece boş bir kabuk kalır. Sislerin arasında kaybolan o ruhu bul ve eve geri getir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Astral Seyahat ve İz Sürme</h4>
                    <p>Hastanın alnına dokunarak zihninizi onun zihnine bağlayın. Bilincinizi astral sislerin arasına göndererek hastanın korku ve travmalarından kaçan ruhunun izini sürün.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Gümüş Kordonu Yeniden Bağlama</h4>
                    <p>Kaybolmuş ruhu bulduğunuzda ona umut ve güven fısıldayarak astral düzlemdeki gümüş kordonundan tutup fiziksel bedene doğru yönlendirin. Ruh bedene oturduğu an hasta derin bir nefesle gözlerini açacaktır.</p>
                </div>`
            ]
        },
        {
            id: "healing9", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "Yüce Hayat Ağacı Şifası & Hücresel Yenilenme",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Kutsal ormanların kadim enerjisini yönlendirerek ölümcül yaraları onarma ve müttefiklerin hücresel yapısını baştan yaratma ilmi.",
            intro: `Gerçek şifa, bozulanı yamamak değil; evrenin ilk yaratılış anındaki kusursuz tasarıma geri dönmektir. Yüce Hayat Ağacı'nın özüne dokunan biri, ölümü bile bir süreliğine kapıda bekletebilir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Yaşam Enerjisinin Köklerle Rezonansı</h4>
                    <p>Gerçek şifa, dışarıdan bir müdahale değil, bedenin evrensel yaşam ağına (The Verdant Web) yeniden bağlanmasıdır. Emparos'un öğretisine göre her canlı, Yüce Hayat Ağacı'nın birer yaprağıdır. Yaralı bir müttefiki iyileştirmek için kendi auranızı toprağın derinliklerindeki köklerle birleştirmeli ve saf yaşam özünü damarlara aktarmalısınız.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Hücresel Boyutta Yeniden Doğuş</h4>
                    <p>Bu ilimde ustalaşan bir şifacı, sadece açık yaraları kapatmakla kalmaz; parçalanmış organları ve zehirlenmiş kanı hücresel boyutta yeniden kodlayarak savaşçıyı eskisinden daha dirençli hale getirir.</p>
                </div>`
            ]
        },
        {
            id: "healing10", category: "healing", badgeClass: "healing",
            badge: '<i class="fa-solid fa-leaf"></i> Şifa İlimleri',
            title: "İlahi Diriliş & Ölümün Kıyısından Alma",
            master: "Doğa Tanrısı Emparos",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Son nefesini henüz vermiş bir savaşçının kalbini saf doğa şokuyla yeniden çalıştırma ve ruhunu ölüm diyarından çekip çıkarma.",
            intro: `Ölüm, bazen sadece aceleci bir misafirdir. Eğer ruh henüz nehrin karşı kıyısına geçmediyse, Emparos'un kudreti o kapıyı kırıp yoldaşını geri alabilir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kalp Masajı ve Bio-Elektrik Şoku</h4>
                    <p>Hastanın göğüs kafesine ellerinizi yerleştirin. Topraktan çektiğiniz muazzam bio-elektrik enerjisini tek bir şok dalgası halinde kalbe aktararak durmuş sinis düğümünü yeniden ateşleyin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Ölüm Meleğiyle Pazarlık (Sacrifice)</h4>
                    <p>Diriliş işlemi evrensel denge kurallarını zorlar. Bu büyüyü yapan şifacı, kendi yaşam süresinden aylar veya yıllar feda etmek zorunda kalabilir. Bu yüzden sadece en kritik kahramanlar için kullanılır.</p>
                </div>`
            ]
        },

        // --- 4. ZANAAT & DEMİRCİLİK (CRAFTING) - 10 DERS ---
        {
            id: "craft1", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Temel Maden İşleme & Örs Isısı Ayarlama",
            master: "Demirci Thorgrın",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Ham cevherleri cürufundan arındırma, ocak ateşini harlı tutma ve çekiç tutuş teknikleriyle metalin yönünü belirleme rehberi.",
            intro: `Metal inatçıdır; sabırsız bir çekiç onu sadece kırar. Thorgrın der ki: "Önce ocağın ateşini kalbinde hisset, sonra çekicini metalle tanıştır."`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Cevheri Cürufundan Arındırma</h4>
                    <p>Dağların derinliklerinden çıkarılan ham cevherler, içlerinde zayıflık yaratan cüruflar barındırır. Cevheri ocakta akkor hale gelene kadar eritmeli ve ilk çekiç darbelerini sadece bu kirli tabakayı kusması için vurmalısınız.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Ocak Ateşinin Rengini Okuma</h4>
                    <p>Ateş sarıysa metal fazla yumuşamıştır; koyu kırmızıysa çekiç darbesi çatlak yaratır. Tam kiraz kırmızısı tonunu yakaladığınız an, metali şekillendirmek için en kusursuz zaman aralığıdır.</p>
                </div>`
            ]
        },
        {
            id: "craft2", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Körük Disiplini & Karbon Zenginleştirme",
            master: "Demirci Thorgrın",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Ocağa doğru oranda oksijen pompalayarak demiri çeliğe dönüştüren ideal karbon emilimini sağlama teknikleri.",
            intro: `Ateş nefes almazsa ölür. Körüğün kolunu bir ejderhanın ciğerleri gibi ritmik ve güçlü çekmelisin.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ritmik Körük Pompalama</h4>
                    <p>Körüğü hızlı çekmek ateşi boğar, yavaş çekmek ise ısıyı düşürür. Kalp atışınızın ritmiyle körüğü pompalayarak kömürlerin sürekli beyaz bir parıltıda kalmasını sağlayın.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kömür ve Karbon Difüzyonu</h4>
                    <p>Demir cevherinin içine odun kömüründen süzülen karbon atomlarının işlemesi gerekir. Bu işlem demirin kırılganlığını alır ve ona kılıç olabilecek o muazzam esnekliği ve sertliği kazandırır.</p>
                </div>`
            ]
        },
        {
            id: "craft3", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Kılıç Perçemleme & Kabza Dengesi",
            master: "Demirci Thorgrın",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-balance-scale"></i> Orta Seviye',
            desc: "Kılıcın ağırlık merkezini siperliğe yakınlaştırarak savaşçının bileğini yormayan kusursuz kabza montajı sanatı.",
            intro: `Kılıç ne kadar keskin olursa olsun, dengesi bozuksa sahibinin bileğini düşmandan önce keser. Denge, kılıcın ruhudur.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ağırlık Merkezi (PoB) Hesaplaması</h4>
                    <p>Kılıcın bıçağı ile kabzası arasındaki ağırlık noktası, siperliğin tam 3 parmak önünde olmalıdır. Eğer namlu ağır basarsa kılıç hantal olur; kabza ağır basarsa kesme gücü zayıflar.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Pommel (Topuz) Montajı ve Sıcak Perçem</h4>
                    <p>Kuyruk kısmını kabza ahşabının içinden geçirin ve ucunu akkor hale getirip çekiçle ezerek topuzu (pommel) sabitleyin. Bu montaj asla gevşemez ve kılıç yekpare bir his verir.</p>
                </div>`
            ]
        },
        {
            id: "craft4", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Zincir Zırh Örme & Perçinli Halkalar",
            master: "Demirci Thorgrın",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-link"></i> Orta Seviye',
            desc: "Binlerce küçük çelik halkayı 4'ü 1 yerde kuralına göre örerek ok geçirmez ve esnek zincir gömlekler üretme.",
            intro: `Sabır, demircinin en ağır çekicidir. Tek bir halkanın perçini zayıf olursa, o gömleği giyen kralın kalbine bir ok saplanır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Tel Çekme ve Halka Sarma</h4>
                    <p>Çelik telleri silindirik bir milin üzerine sıkıca sararak yay haline getirin. Ardından bu yayı keskiyle keserek binlerce eşit çaplı açık halka elde edin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. 4'ü 1 Yerde Örgüsü ve Perçinleme</h4>
                    <p>Her bir halkanın içinden 4 komşu halkayı geçirin ve açık uçları küçük çelik perçinlerle çekiçleyerek kapatın. Bu örgü kılıç darbelerine karşı muazzam bir esnek koruma sunar.</p>
                </div>`
            ]
        },
        {
            id: "craft5", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Şam Çeliği (Damascus) & Katlama Sanatı",
            master: "Demirci Thorgrın",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Farklı karbon oranlarına sahip çelikleri yüzlerce kez üst üste katlayıp döverek eşsiz su yolu desenleri ve kırılmaz bıçaklar üretme.",
            intro: `Çeliği katlamak, onun karakterini yoğurmaktır. Sert çelik keskinliği verir, yumuşak çelik ise esnekliği. İkisini evlendirdiğinde efsane doğar.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Billet Hazırlama ve Kaynatma Isısı</h4>
                    <p>Yüksek karbonlu ve düşük karbonlu çelik plakaları tost gibi üst üste dizin. Boraks tozu dökerek oksitlenmeyi önleyin ve ocakta beyaz kaynama ısısına ulaşıp çekiçle tek parça haline getirin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Katlama ve Desen Çıkarma</h4>
                    <p>Eriyen bloğu uzatın, ortadan ikiye katlayın ve tekrar dövün. Bu işlemi 10 kez tekrarladığınızda 1024 katmanlı efsanevi bir çelik elde edersiniz. Asitle dağlandığında o büyüleyici dalga desenleri ortaya çıkar.</p>
                </div>`
            ]
        },
        {
            id: "craft6", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Plaka Zırh Şekillendirme & Ergonomi",
            master: "Demirci Thorgrın",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Savaşçının vücut hatlarına kusursuz oturan, kılıç darbelerini kaydıran oval hatlı çelik göğüs plakaları dövme.",
            intro: `Zırh bir teneke kutu değil, savaşçının ikinci derisidir. Eğer zırh hareketini kısıtlarsa, seni düşmandan önce o zırh öldürür.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Soğuk Çekiçleme (Dishing) ve Oluklar</h4>
                    <p>Çelik plakayı ahşap bir çukur örsün üzerinde yuvarlak başlı çekiçle döverek kubbe şekli verin. Kenarlara açacağınız oluklar (fluting), zırhın ağırlığını artırmadan direncini iki katına çıkarır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Eklem Hareketliliği ve Mafsallar</h4>
                    <p>Dirsek ve diz korumalarını (poleyn, couter) kayar perçinlerle birbirine bağlayın. Savaşçı koştuğunda veya kılıç savurduğunda zırh plakaları birbiri üzerinde tereyağı gibi pürüzsüzce kaymalıdır.</p>
                </div>`
            ]
        },
        {
            id: "craft7", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Mithril İşleme & Hafif Alaşım Sentezi",
            master: "Demirci Thorgrın",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Gümüşten daha parlak, çelikten daha sert ve tüy kadar hafif olan efsanevi Mithril cevherini işleme ve zırh dövme sanatı.",
            intro: `Mithril, dağların kalbindeki yıldız ışığıdır. Onu eritmek için sıradan kömür yetmez; ocağında ejderha nefesi veya saf cüce büyüsü yakmalısın.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ultra Yüksek Isı Ocakları</h4>
                    <p>Mithril cevheri sıradan ocaklarda erimez. Ocağın altını magmatik yakıtlar ve rünik körüklerle besleyerek 3000 derecelik cüce ocak ısısına ulaşmalısınız.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Çekiçleme Hassasiyeti</h4>
                    <p>Mithril dövülürken çan gibi tınlar. Çok sert vurursanız elmas gibi çatlar; çok hafif vurursanız şekil almaz. Çekiç darbeleriniz bir müzisyenin arp çalması kadar hassas ve ritmik olmalıdır.</p>
                </div>`
            ]
        },
        {
            id: "craft8", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Adamantiyum Dövme & Kırılmaz Kalkanlar",
            master: "Demirci Thorgrın",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Evrenin bilinen en sert metali olan Adamantiyum ile asla delinmeyen, ejderha ateşine dayanan efsanevi kule kalkanları üretme.",
            intro: `Adamantiyum bir kez soğuyup mühürlendiğinde, onu evrendeki hiçbir güç bir daha bükemez. O kalkanın arkasındayken, dağlar yıkılsa bile sen ayakta kalırsın.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Sıvı Halde Şekillendirme (Casting)</h4>
                    <p>Adamantiyum dövülmeye gelmez; kalıba dökülmelidir. Ergimiş metali efsanevi volkanik kil kalıplarına dökün ve kristalizasyon sürecini saniye saniye takip edin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Şok Emici Katman Montajı</h4>
                    <p>Kalkanın arkasına ejderha derisi ve kalın meşe katmanları ekleyerek gelen darbelerin kinetik şokunu kalkanın tüm yüzeyine dağıtacak titreşim emici bir yastık oluşturun.</p>
                </div>`
            ]
        },
        {
            id: "craft9", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Efsanevi Silah Dövme & Kadim Rün İşleme",
            master: "Demirci Thorgrın",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Sıradan metalleri tanrısal silahlara dönüştürmek için örs üzerinde kadim rünleri çekiç darbeleriyle mühürleme sanatı.",
            intro: `Sıradan bir silah bedeni keser; efsanevi bir silah ise kaderi keser. Thorgrın'in örsünde dövülen bir kılıç, sahibinin ruhuyla mühürlenir ve asırlar boyunca adını yaşatır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Tanrısal Metali Eğitme Sanatı</h4>
                    <p>Sıradan bir demirci metali döver; efsanevi bir demirci ise metalle konuşur. Thorgrın'in örsünde dövülen her silah, dövüşçünün ruhuyla bağ kuracak özel bir rezonans odasına sahiptir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Çekiç Darbeleriyle Rün Mühürleme</h4>
                    <p>Kızgın metal henüz soğumadan üzerine vurulan her çekiç darbesi, kadim bir rünü silahın atomik yapısına işler. Bu silahlar asla körelmez ve sahibinin iradesiyle alev alabilir.</p>
                </div>`
            ]
        },
        {
            id: "craft10", category: "crafting", badgeClass: "crafting",
            badge: '<i class="fa-solid fa-hammer"></i> Zanaat & Demircilik',
            title: "Canlı Silahlar & Ruh Mühürleme (Soulforge)",
            master: "Demirci Thorgrın",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Dövülen kılıcın kabzasına efsanevi bir varlığın veya elementel ruhun bilincini mühürleyerek sahibiyle telepatik konuşan canlı silahlar yaratma.",
            intro: `Bir kılıç sadece demir ve karbondan ibaret değildir. Eğer onun kalbine kadim bir ruhu üflersen, o kılıç senin sadece silahın değil, en sadık yoldaşın olur.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ruh Kapanı Kabzası Hazırlama</h4>
                    <p>Kılıcın kabzasına kusursuz bir elmas veya ejderha gözü yerleştirin. Bu taş, çağrılacak ruhun bilincini barındıracak mistik bir hapishane ve saray işlevi görecektir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Telepatik Bağ ve Silahın İradesi</h4>
                    <p>Ruh mühürlendiğinde kılıç titremeye başlar ve sahibinin zihnine ilk fısıltısını gönderir. Bu kılıçlar tehlikeyi önceden sezebilir, sahibinin eline kendiliğinden uçabilir. Ancak kılıcın iradesi sahibinden güçlüyse, savaşçıyı kendi kontrolüne alabilir.</p>
                </div>`
            ]
        },

        // --- 5. SİMYA & İKSİR (ALCHEMY) - 10 DERS ---
        {
            id: "alchemy1", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Temel Bitki Damıtma & Hafif Şifa İksirleri",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Sıradan orman otlarını imbikten geçirerek zehir arındırıcı ve hafif sıyrıkları iyileştirici temel solüsyonlar hazırlama.",
            intro: `Simya, doğanın sabrını bir şişeye sığdırma sanatıdır. En zehirli mantar bile, doğru imbikten geçtiğinde hayat kurtaran bir iksire dönüşebilir. Malafez'in imbikleri asla sönmez.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Doğru Hasat Zamanı ve Kurutma</h4>
                    <p>Şifa otları sadece dolunay ışığında veya sabah çiy düşmeden hemen önce hasat edilmelidir. Güneşte kurutulan otlar özünü kaybeder; bu yüzden daima loş ve esintili mağara odalarında asılarak kurutulmalıdır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. İmbikten Geçirme ve Tortu Filtreleme</h4>
                    <p>Kaynama noktasına ulaşan solüsyon, gümüş borulardan geçirilerek buharlaştırılır. Kalan dip tortusu zehirlidir ve asla ana iksire karışmamalıdır. Elde edilen berrak sıvı, temel şifa iksirinin kalbidir.</p>
                </div>`
            ]
        },
        {
            id: "alchemy2", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Karanlık Görüş İksiri & Kedi Gözü Özü",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Zindanların zifiri karanlığında meşaleye ihtiyaç duymadan etrafı gündüz gibi gösteren fosforlu solüsyonlar hazırlama.",
            intro: `Gözler sadece ışığı görür; simya ise zihnin karanlığı görmesini sağlar. Bu iksirden bir yudum aldığında, gecenin tüm sırları önünde aydınlanacak.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Mağara Mantarları ve Fosfor Çözeltisi</h4>
                    <p>Güneş görmeyen mağaralarda yetişen 'Parlayan Şapka' mantarlarını ezerek suyunu çıkarın. İçine birkaç damla rafine balık yağı ekleyerek solüsyonu stabilize edin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Retinada Geçici Mutasyon</h4>
                    <p>İksir içildiğinde göz bebekleri bir kedininki gibi dikey olarak daralır ve gözler sarı bir parıltıyla parlar. 1 saat boyunca zifiri karanlıkta kusursuz görüş sağlar, ancak ani güneş ışığı geçici körlük yapabilir.</p>
                </div>`
            ]
        },
        {
            id: "alchemy3", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Asit Bombaları & Zırh Çürütme Solüsyonları",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-skull-crossbones"></i> Orta Seviye',
            desc: "Düşman şövalyelerinin çelik zırhlarını ve kale kapılarını saniyeler içinde köpürterek eriten yüksek korozif kimyasallar sentezleme.",
            intro: `Her metalin bir zayıf noktası vardır. Malafez'in asidi, en gururlu şövalyenin zırhını bile saniyeler içinde paslı bir tenekeye dönüştürür.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Sülfürik Damıtma ve Cam Şişeleme</h4>
                    <p>Volkanik gayzerlerden toplanan sülfür kristallerini nitrik asitle tepkimeye sokun. Bu solüsyon o kadar güçlüdür ki sadece özel cüce yapımı kalın cam şişelerde muhafaza edilebilir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Patlama ve Korozif Etki</h4>
                    <p>Şişe hedefin zırhına çarpıp kırıldığı an asit şiddetle köpürür. Çelik zırhı ve altındaki deri katmanı saniyeler içinde eriterek düşmanı savunmasız bırakır.</p>
                </div>`
            ]
        },
        {
            id: "alchemy4", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Hız İksiri & Çeviklik Patlaması",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-bolt"></i> Orta Seviye',
            desc: "Sinir sistemini aşırı yükleyerek reaksiyon süresini yarıya indiren ve savaşçıya rüzgar hızı kazandıran uyarıcı iksirler.",
            intro: `Hız, savaş alanındaki en keskin kılıçtır. Düşmanın kılıcı daha kalkmadan sen üçüncü hamleni yapmış olacaksın.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Çita Kanı ve Yıldırım Otu Sentezi</h4>
                    <p>Yıldırım Otu köklerini eterle çözün ve yüksek rakımda yaşayan vahşi çitaların kan özüyle karıştırın. Solüsyon sürekli elektrikleniyormuş gibi küçük kıvılcımlar çıkarmalıdır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kalp Ritmi ve Çöküş (Crash) Semptomu</h4>
                    <p>İksir içildiğinde dünya etrafınızda yavaşlamış gibi görünür; koşu hızınız ve refleksleriniz iki katına çıkar. Ancak etki 15 dakika sonra bittiğinde kaslarda şiddetli bir laktik asit birikmesi ve yorgunluk çöküşü yaşanır.</p>
                </div>`
            ]
        },
        {
            id: "alchemy5", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Görünmezlik İksiri & Işık Bükme Solüsyonu",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Vücudun foton emilimini sıfırlayarak ışığın bedenin içinden geçmesini sağlayan ve kişiyi tamamen şeffaf kılan efsanevi iksir.",
            intro: `Gözden kaybolmak, düşmanın zihninde bir hayalete dönüşmektir. Malafez'in sırrı, ışığı bükerek varlığı hiçliğe gizlemektir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Şeffaf Kanat Tozu ve Eter Çözeltisi</h4>
                    <p>Nadir bulunan 'Cam Kelebeği' kanatlarının tozunu eter ve saf cıvayla dikkatlice damıtın. İksir şişesinin içinde sıvı yokmuş gibi tamamen saydam görünmelidir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Işık Kırılması ve Kısıtlamalar</h4>
                    <p>İksir içildiğinde teniniz, zırhınız ve silahlarınız ortamdaki ışığı bükerek sizi tamamen şeffaf hale getirir. Ancak ani hareketler havada dalgalanma (predator effect) yaratır ve saldırı yaptığınız an büyü bozulur.</p>
                </div>`
            ]
        },
        {
            id: "alchemy6", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Dev Gücü İksiri & Kas Yoğunlaştırma",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Kas liflerini geçici olarak üç katına çıkararak sıradan bir piyadeye kale kapılarını koçbaşı gibi kıracak fiziksel güç kazandırma.",
            intro: `Güç sadece doğuştan gelen bir lütuf değildir. Doğru iksir damarlarında dolaştığında, bir dağ trolünü bile bilek güreşinde devirebilirsin.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Ayı Ödü ve Troll Kanı Sentezi</h4>
                    <p>Dağ trollerinin yenileyici kanını ayı ödü ve ezilmiş granit tozuyla kaynatın. Solüsyon koyu kırmızı, kıvamlı ve ağır kokulu bir pekmez haline gelmelidir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Hipertrofi ve Fiziksel Büyüme</h4>
                    <p>İçildiği an kaslar şiddetle şişer, damarlar derinin üzerine fırlar ve boyunuz 20 santim uzar. Fiziksel gücünüz muazzam artar, ancak zırhınız dar gelebilir ve eklemlerinizde ağrı oluşabilir.</p>
                </div>`
            ]
        },
        {
            id: "alchemy7", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Ejderha Kanı İksiri & Mutlak Şifa Simyası",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Nadir volkanik bitkiler ve ejderha özü kullanarak ölümcül yaraları saniyeler içinde iyileştiren iksirlerin formülleri.",
            intro: `Ejderhanın kanı hem lütuftur hem lanet. Damarlarında sıvı bir ateş taşımaya cesareti olmayanlar, Malafez'in kadehinden yudum almamalıdır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Volkanik Bitkiler ve Saf Ejderha Özü</h4>
                    <p>Gerçek bir şifa iksiri, sadece bedeni onarmakla kalmaz; hücrelerin yaşam enerjisini baştan yaratır. Malafez'in gizli formülü, aktif volkanların eteklerinde yetişen 'Kül Çiçeği' ile damıtılmış ejderha kanının yüksek ısıda sentezlenmesine dayanır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. İksirin Kullanımı ve Yan Etkileri</h4>
                    <p>Bu iksir içildiği anda damarlarda sıvı bir ateş dolaşıyormuş hissi yaratır. Kopmuş uzuvları veya ölümcül zehirleri saniyeler içinde temizler, ancak zayıf bünyeli savaşçılarda geçici deliliğe yol açabilir.</p>
                </div>`
            ]
        },
        {
            id: "alchemy8", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Taş Derisi İksiri & Kinetik Emilim",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Derinin dış katmanını geçici olarak esnek bir granit dokusuna dönüştürerek kılıç darbelerini ve okları zırhsız karşılama.",
            intro: `Zırh delinebilir, kalkan kırılabilir. Ancak kendi derini dağların kayası gibi sertleştirdiğinde, düşmanın kılıcı sadece senin teninde körelir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Gorgon Pulu ve Kireçtaşı Özütü</h4>
                    <p>Efsanevi Gorgon yılanlarının pullarını asitte eritip kireçtaşı özüyle bağlayın. İksir içildiğinde deriniz grileşir ve pürüzlü, mermerimsi bir doku kazanır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kılıç Sekmesi ve Hantallık</h4>
                    <p>Bu durumdayken gelen kılıç darbeleri teninizden kıvılcım çıkararak seker, oklar saplanamadan kırılır. Ancak esnekliğiniz azalır ve eklemleriniz taşlaşıyormuş gibi ağırlaşır.</p>
                </div>`
            ]
        },
        {
            id: "alchemy9", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Felsefe Taşı & Kurşunu Altına Çevirme",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Simyanın nihai zirvesi olan Felsefe Taşı sentezi ile değersiz metalleri saf altına dönüştürme ve maddeyi baştan yaratma.",
            intro: `Madde sadece bir illüzyondur. Evrendeki her şey aynı temel atomların farklı diziliminden ibarettir. Malafez'in taşı, o dizilimi tek dokunuşla değiştirir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Magnum Opus (Büyük İş) Aşamaları</h4>
                    <p>Nigredo (siyahlaşma), Albedo (beyazlaşma), Citrinitas (sarılaşma) ve Rubedo (kızıl aşama) süreçlerini eksiksiz tamamlayarak efsanevi kızıl pudrayı sentezleyin.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Transmutasyon ve Atomik Dizilim</h4>
                    <p>Eriyen kurşunun içine bir toplu iğne başı kadar Felsefe Taşı tozu attığınız an, metalin atomik kafesi saniyeler içinde yeniden dizilir ve potada göz kamaştırıcı saf altın parlar.</p>
                </div>`
            ]
        },
        {
            id: "alchemy10", category: "alchemy", badgeClass: "alchemy",
            badge: '<i class="fa-solid fa-flask-vial"></i> Simya & İksir',
            title: "Ölümsüzlük İksiri (Elixir of Life) & Ebedi Gençlik",
            master: "Ejder Tanrıçası Malafez",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Hücresel yaşlanmayı tamamen durdurarak kişiye ebedi gençlik ve hastalıklara karşı mutlak bağışıklık kazandıran efsanevi iksir.",
            intro: `Zaman, her faniyi eriten yavaş bir asittir. Ancak Malafez'in kadehinden içilen saf yaşam iksiri, o saati sonsuza dek durdurur.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Hayat Ağacı Özü ve Anka Gözyaşı</h4>
                    <p>Yüce Hayat Ağacı'nın en derin kökünden süzülen saf öz suyu, efsanevi Anka kuşunun gözyaşıyla yakamoz ışığında damıtın. İksir kendi kendine altın sarısı bir ışık yaymalıdır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Hücresel Ölümsüzlük ve Bedel</h4>
                    <p>İksir içildiğinde vücuttaki tüm yaşlı hücreler anında yenilenir, saçlardaki aklar kaybolur ve organlar 20 yaşındaki diriliğine döner. Kişi yaşlanmaz ve hastalanmaz; ancak fiziksel kılıç darbeleriyle hala öldürülebilir.</p>
                </div>`
            ]
        },

        // --- 6. KEHANET & TARİH (LORE) - 10 DERS ---
        {
            id: "lore1", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Kozmik Yıldız Haritaları & Astrolojiye Giriş",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Gökyüzündeki takımyıldızların hareketlerini izleyerek yaklaşan fırtınaları, bereket dönemlerini ve küçük kader akışlarını hesaplama.",
            intro: `Gökyüzü, tanrıların geçmişi ve geleceği yazdığı devasa bir parşömendir. Yıldızların dilini çözebilen bir göz, yeryüzündeki hiçbir fırtınaya hazırlıksız yakalanmaz.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Takımyıldızların Açısal Konumları</h4>
                    <p>Gece göğündeki 'Büyük Ejder' ve 'Kırık Kılıç' takımyıldızları birbirine yaklaştığında, yeryüzünde büyük bir savaşın veya kıtlığın habercisidir. Astrolab kullanarak bu açıları milimetrik olarak kaydetmelisiniz.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Yıldız Haritası Çıkarma Metodolojisi</h4>
                    <p>Bir savaşçının veya krallığın doğuş anındaki yıldız konumları, onların zayıf noktalarını ve kader kırılmalarını gösterir. Bu haritalar, savaş stratejilerinde zaferin anahtarıdır.</p>
                </div>`
            ]
        },
        {
            id: "lore2", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Kadim Rün Kitabeleri & Ölü Diller",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "beginner", difficulty: '<i class="fa-solid fa-seedling"></i> Başlangıç Seviye',
            desc: "Yıkılmış kadim uygarlıkların bıraktığı taş kitabeleri okuma ve unutulmuş büyü dillerinin gramerini çözme sanatı.",
            intro: `Tarih sadece kazananların yazdığı kitaplarda değil, toprağın altına gömülmüş kırık taşların üzerindeki fısıltılarda gizlidir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Epigrafi ve Rün Kökleri</h4>
                    <p>Kadim İthil dilindeki rünler, sembolik değil fonetiktir. Taşın üzerindeki her bir oyuk, dilin damağa vuruş açısını gösterir. Doğru telaffuz edilmeyen bir rün, kitabenin gizli bölmesini açmaz.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kitabe Karbon Tarihlemesi</h4>
                    <p>Taşın üzerindeki yosun tabakası ve rünlerin aşınma payı, kitabenin hangi tanrı savaşı dönemine ait olduğunu ele verir. Bu bilgiler, o dönemde gömülmüş efsanevi hazinelerin yerini bulmanızı sağlar.</p>
                </div>`
            ]
        },
        {
            id: "lore3", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Rüya Tabirleri & Oneiromansi İlimi",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-cloud-moon"></i> Orta Seviye',
            desc: "Bilinçaltının astral düzlemle kesiştiği rüyalardaki sembolleri okuyarak gelecekteki suikastları ve ihanetleri önceden sezme.",
            intro: `Rüyalar, zihnin uyanıkken görmezden geldiği gerçeklerin gece vakti giydiği maskelerdir. Maskeyi kaldır ve kaderin yüzüne bak.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Sembolik Astral Düzlem (The Dreaming)</h4>
                    <p>Rüyanızda gördüğünüz siyah bir köpek ölümün değil, sadık bir dostun ihanetinin habercisidir. Dişlerin dökülmesi ise krallığın hazinesinin suyunu çekeceğini gösterir. Sembolleri asla kelime anlamıyla yorumlamayın.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Lucid (Bilinçli) Rüya ve Müdahale</h4>
                    <p>Rüyanın içinde uyanık kalmayı başarırsanız, Merinos'un astral kütüphanesine girebilir ve orada henüz yaşanmamış olayların yazıldığı kitapları okuyabilirsiniz.</p>
                </div>`
            ]
        },
        {
            id: "lore4", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Sarkaç Kehaneti & Kayıp Eşya Bulma",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "intermediate", difficulty: '<i class="fa-solid fa-compass"></i> Orta Seviye',
            desc: "Doğal kristal sarkaçlar kullanarak harita üzerinde düşman ordularının konumunu ve gömülü hazineleri tespit etme.",
            intro: `Dünyadaki her nesne görünmez bir enerji bağıyla birbirine bağlıdır. Sarkacın ucu, o bağların titreştiği yönü asla şaşmaz.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kristal Rezonansı ve Harita Kalibrasyonu</h4>
                    <p>Saf kuvars sarkacınızı aradığınız nesnenin (veya kişinin) bir parçasıyla (saç teli, kan damlası, kumaş) rezonansa sokun. Haritanın üzerinde tuttuğunuz sarkaç, hedef noktaya yaklaştıkça dairesel dönüşlerini hızlandıracaktır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Düşman Birliklerini Haritalama</h4>
                    <p>Savaş öncesinde komutan çadırında harita üzerine tutulan sarkaç, düşman süvarilerinin vadinin hangi kolundan pusuya yattığını milimetrik olarak gösterebilir.</p>
                </div>`
            ]
        },
        {
            id: "lore5", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Pyromansi & Ateşten Geleceği Okuma",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Kutsal ocak ateşine atılan nadir bitkilerin çıkardığı duman ve alev şekillerinden krallıkların kaderini okuma sanatı.",
            intro: `Ateş sadece odunu yakmaz; zamanın perdelerini de yakıp kül eder. Alevlerin dansında yaklaşan savaşların çığlıklarını dinle.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kutsal Defne ve Günlük Reçinesi</h4>
                    <p>Harlı meşe ateşinin içine kurutulmuş defne yaprakları ve günlük reçinesi atın. Çıkan beyaz dumanın kıvrımları, zihninize gelecekteki savaş sahnelerinin vizyonlarını düşürecektir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Alev Dillerinin Yorumu</h4>
                    <p>Alevler dikey ve çatal şeklinde yükseliyorsa zafer yakındır; ancak ateş aniden maviye dönüp kıvılcım saçıyorsa, krallığın içinden çok büyük bir ihanet kapıdadır.</p>
                </div>`
            ]
        },
        {
            id: "lore6", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Aeromansi & Atmosferik Kehanetler",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "advanced", difficulty: '<i class="fa-solid fa-star-half-stroke"></i> İleri Seviye',
            desc: "Rüzgarın esiş yönünü, bulutların şeklini ve fırtına habercisi kuşların uçuş düzenlerini inceleyerek büyük doğal afetleri sezme.",
            intro: `Rüzgar, dünyanın nefesidir. O nefes bazen ılık bir ninni söyler, bazen de yaklaşan bir kıyametin çığlığını atar.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Bulut Formasyonları ve Basınç</h4>
                    <p>Gökyüzündeki 'Kızıl Örs' bulutları sadece yağmurun değil, güneyden gelecek devasa bir istila ordusunun kaldırdığı toz bulutunun atmosferik yansımasıdır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kuşların Göç ve Kaçış Yönleri</h4>
                    <p>Kargalar ve çaylaklar normal rotalarının tersine, dağlardan ovalara doğru çılgınca uçuyorsa, o dağların derinliklerinde kadim bir ejderha veya iblis uykusundan uyanıyor demektir.</p>
                </div>`
            ]
        },
        {
            id: "lore7", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Nekromantik Fısıltılar & Ölülerle Konuşma",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "Mezarlıklarda ve kadim savaş alanlarında yatan ölülerin ruhlarını çağırarak geçmişin gizli kalmış sırlarını öğrenme sanatı.",
            intro: `Ölüler yalan söylemez; çünkü artık kimseden korkuları veya beklentileri kalmamıştır. Onların soğuk dudaklarından dökülen her kelime mutlak gerçektir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Mezar Toprağı ve Kan Bağı Ritüeli</h4>
                    <p>Konuşmak istediğiniz kişinin mezar toprağına kendi kanınızla Merinos'un sorgu rününü çizin. Ruh, yarı saydam bir sis halinde mezar taşının üzerinde belirecektir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Üç Soru Kuralı</h4>
                    <p>Çağrılan ruha sadece 3 net soru sorabilirsiniz. Dördüncü soruyu sorarsanız ruh öfkelenir ve bilincinizi kendiyle birlikte ölüm diyarının karanlığına çekebilir.</p>
                </div>`
            ]
        },
        {
            id: "lore8", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Kozmik İplikler & Kader Bağlarını Görme",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "expert", difficulty: '<i class="fa-solid fa-medal"></i> Usta Seviye',
            desc: "İnsanların başlarının üzerinde asılı duran altın, gümüş ve siyah kader ipliklerini görerek kimin ne zaman öleceğini hesaplama.",
            intro: `Her canlının kaderi görünmez ipliklerle evrenin tavanına asılıdır. O iplik inceldiğinde, ölüm meleğinin makası çoktan yola çıkmış demektir.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Üçüncü Gözün Açılması (The Weaver's Sight)</h4>
                    <p>Alnınızdaki epifiz merkezine yoğunlaşarak insanların etrafındaki kader ipliklerini görün. İplik altın sarısıysa kişi büyük bir kral olacak; siyah ve yıpranmışsa 3 gün içinde ölecektir.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. İplik Kesme (Kader Müdahalesi)</h4>
                    <p>Çok nadir durumlarda usta bir kahin, düşman komutanının altın ipliğini zihinsel bir makasla keserek onun savaş alanında şanssız bir okla ölmesini sağlayabilir. Ancak bu müdahale kahinin kendi ömründen yer.</p>
                </div>`
            ]
        },
        {
            id: "lore9", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Zaman Çarkları & Kader Çizgilerini Okuma",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Geçmiş ve gelecekteki olasılıkları görmek için kum saatlerinin ve kozmik yıldız dizilimlerinin kadim dilini çözme rehberi.",
            intro: `Zaman nehir gibi akmaz; devasa dişliler gibi döner. Kaderin çarkına parmağını sokan biri, ya geleceği değiştirir ya da o dişliler arasında un ufak olur. Merinos, çarkın kolunu tutan tek varlıktır.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Kum Saatlerinin Kozmik Sırrı</h4>
                    <p>Zaman, düz bir çizgi değil; sürekli birbiriyle kesişen devasa kozmik çarklardan ibarettir. Merinos'un rahipleri, yıldız dizilimlerini ve kutsal kum saatlerini izleyerek gelecekteki olası savaşları ve felaketleri önceden görebilirler.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Kaderi Değiştirmenin Bedeli</h4>
                    <p>Bir kehaneti bilmek, onun gerçekleşme olasılığını doğrudan etkiler. Kader çizgisine yapılan her müdahale, evrenin başka bir noktasında beklenmedik bir yıkıma (Kelebek Etkisi) sebep olur.</p>
                </div>`
            ]
        },
        {
            id: "lore10", category: "lore", badgeClass: "lore",
            badge: '<i class="fa-solid fa-scroll"></i> Kehanet & Tarih',
            title: "Krono-Sıçrama & Zamanda Yolculuk İlimi",
            master: "Kehanet Tanrıçası Merinos",
            difficultyClass: "master", difficulty: '<i class="fa-solid fa-star"></i> Üstat Seviye',
            desc: "Kehanetin nihai zirvesi olan fiziksel zaman yolculuğu ile geçmişteki büyük kırılma noktalarına gidip tarihi baştan yazma sanatı.",
            intro: `Geçmiş, taşa kazınmış bir yazı değildir; sadece kurumuş bir mürekkeptir. Eğer elinde Merinos'un tüy kalemi varsa, o sayfayı baştan yazabilirsin.`,
            pages: [
                `<div class="academy-parchment-text">
                    <h4>I. Zaman Geçidi (Krono-Portal) Açma</h4>
                    <p>Kutsal kum saatinizi kırarak içindeki kozmik kumu etrafınıza dökün ve Merinos'un efsanevi zaman rününü tersten okuyun. Açılan girdap sizi doğrudan geçmişin savaş alanlarına fırlatacaktır.</p>
                </div>`,
                `<div class="academy-parchment-text">
                    <h4>II. Büyük Paradoks Tehlikesi</h4>
                    <p>Geçmişte yapacağınız en küçük değişiklik (örneğin dedenizin ölümüne sebep olmak veya eski bir kralı kurtarmak), geleceği tamamen silebilir veya evreni sonsuz bir zaman döngüsüne (Time Loop) kilitleyebilir. Bu ilim, tanrıların bile korktuğu nihai yasaktır.</p>
                </div>`
            ]
        }
    ];

    // --- KARTLARI HTML'E DİNAMİK RENDER ETME ---
    const gridContainer = document.getElementById('academy-grid-container');
    if (gridContainer) {
        let cardsHTML = '';
        academyCourses.forEach(course => {
            cardsHTML += `
                <div class="academy-card" data-category="${course.category}">
                    <div class="academy-card-glow"></div>
                    <div class="academy-badge ${course.badgeClass}">${course.badge}</div>
                    <div class="academy-card-content">
                        <h3 class="academy-course-title">${course.title}</h3>
                        <div class="academy-master"><i class="fa-solid fa-user-tie"></i> ${course.master}</div>
                        <p class="academy-course-desc">${course.desc}</p>
                        <div class="academy-card-footer">
                            <span class="academy-difficulty ${course.difficultyClass}">${course.difficulty}</span>
                            <button class="academy-action-btn" onclick="openAcademyBookModal('${course.id}')">Kitabı Aç</button>
                        </div>
                    </div>
                </div>
            `;
        });
        gridContainer.innerHTML = cardsHTML;
    }

    // --- KADİM BÜYÜ KİTABI SAYFA ÇEVİRME & MODAL KONTROLLERİ ---
    window.openAcademyBookModal = (courseId) => {
        const course = academyCourses.find(c => c.id === courseId);
        const modal = document.getElementById('academy-book-modal');
        if (!course || !modal) return;

        currentBookKey = courseId;
        currentBookPage = 0; // İlk sayfadan başla

        // Sol Sayfa Künyesini Doldur
        document.getElementById('book-modal-badge').innerHTML = course.badge;
        document.getElementById('book-modal-badge').className = 'book-badge ' + course.badgeClass;
        document.getElementById('book-modal-title').innerText = course.title;
        document.getElementById('book-modal-master').innerHTML = '<i class="fa-solid fa-user-tie"></i> ' + course.master;
        document.getElementById('book-modal-intro').innerText = course.intro;
        document.getElementById('book-modal-difficulty').innerHTML = course.difficulty;

        // Sayfayı Render Et
        renderBookPage();

        // Modalı Aç
        modal.classList.add('active');

        // Kitap Açılış Sesi (Opsiyonel Ağır Kapak Sesi)
        let openSound = new Audio('https://actions.google.com/sounds/v1/science_fiction/heavy_door_open.ogg');
        openSound.volume = 0.5;
        openSound.play().catch(e => console.log('Audio error:', e));
    };

    window.closeAcademyBookModal = () => {
        const modal = document.getElementById('academy-book-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    };

    window.turnBookPage = (direction) => {
        const course = academyCourses.find(c => c.id === currentBookKey);
        if (!course) return;

        if (direction === 'next' && currentBookPage < course.pages.length - 1) {
            currentBookPage++;
        } else if (direction === 'prev' && currentBookPage > 0) {
            currentBookPage--;
        } else {
            return; // Sınırdayız
        }

        // Sayfa Çevirme Sesi Çal
        if (bookAudio) {
            bookAudio.pause();
            bookAudio.currentTime = 0;
        }
        bookAudio = new Audio('https://actions.google.com/sounds/v1/office/paper_flip.ogg');
        bookAudio.volume = 0.8;
        bookAudio.play().catch(e => console.log('Audio error:', e));

        // Sayfa Çevirme Animasyonu Uygula
        const rightPageContainer = document.getElementById('book-page-right-container');
        if (rightPageContainer) {
            rightPageContainer.classList.remove('page-turning');
            void rightPageContainer.offsetWidth; // Reflow tetikle
            rightPageContainer.classList.add('page-turning');
        }

        // İçeriği Güncelle
        setTimeout(() => {
            renderBookPage();
        }, 300); // Animasyonun ortasında içeriği değiştir
    };

    function renderBookPage() {
        const course = academyCourses.find(c => c.id === currentBookKey);
        if (!course) return;

        const body = document.getElementById('book-modal-body');
        const prevBtn = document.getElementById('book-prev-page');
        const nextBtn = document.getElementById('book-next-page');
        const leftPageNum = document.getElementById('book-modal-page-left-num');
        const rightPageNum = document.getElementById('book-modal-page-right-num');

        if (body) body.innerHTML = course.pages[currentBookPage];

        // Sayfa Numaraları (Örn: Sayfa 104, 105, 106...)
        const basePage = 104 + (currentBookPage * 2);
        if (leftPageNum) leftPageNum.innerText = `Sayfa ${basePage}`;
        if (rightPageNum) rightPageNum.innerText = `Sayfa ${basePage + 1}`;

        // Buton Durumları
        if (prevBtn) prevBtn.disabled = currentBookPage === 0;
        if (nextBtn) nextBtn.disabled = currentBookPage === course.pages.length - 1;
    }

    // ESC ve Dış tık ile Kadim Kitap modalını kapatma
    const bookModal = document.getElementById('academy-book-modal');
    if (bookModal) {
        bookModal.addEventListener('click', (e) => {
            if (e.target === bookModal) {
                closeAcademyBookModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && bookModal.classList.contains('active')) {
                closeAcademyBookModal();
            }
        });
    }

    // --- LONCALAR VE KULÜPLER İŞLEMLERİ ---
    // --- LONCALAR VE KULÜPLER İŞLEMLERİ ---
    window.loadCustomGuilds = () => {
        const gridContainer = document.getElementById('guilds-grid-container');
        if (!gridContainer) return;

        // Sadece daha önce eklenmiş dinamik kartları temizle
        document.querySelectorAll('.custom-guild-card').forEach(card => card.remove());

        const customGuilds = JSON.parse(localStorage.getItem('asthenya_custom_guilds') || '[]');

        const badgeClasses = {
            combat: 'combat',
            magic: 'magic',
            crafting: 'crafting',
            lore: 'lore',
            healing: 'healing'
        };

        const badgeNames = {
            combat: '<i class="fa-solid fa-khanda"></i> Savaş Loncası',
            magic: '<i class="fa-solid fa-wand-magic-sparkles"></i> Büyü Kulübü',
            crafting: '<i class="fa-solid fa-hammer"></i> Zanaat Loncası',
            lore: '<i class="fa-solid fa-scroll"></i> İrfan Kulübü',
            healing: '<i class="fa-solid fa-hand-holding-medical"></i> Şifa Tarikatı'
        };

        customGuilds.forEach(guild => {
            const bClass = badgeClasses[guild.guildType] || 'combat';
            const bName = badgeNames[guild.guildType] || '<i class="fa-solid fa-shield-halved"></i> Lonca';
            const memCount = guild.members ? guild.members.length : (guild.discordIds ? guild.discordIds.length : 5);

            const cardHTML = `
                <div class="guild-card custom-guild-card" data-category="${guild.guildType}">
                    <div class="guild-card-glow"></div>
                    <div class="guild-badge ${bClass}">${bName}</div>
                    <div class="guild-emblem"><i class="fa-solid ${guild.guildEmblem || 'fa-dragon'}"></i></div>
                    <h3 class="guild-title">${guild.guildName}</h3>
                    <div class="guild-leader"><i class="fa-solid fa-crown"></i> Lider: <span>${guild.leader}</span></div>
                    <p class="guild-motto">"${guild.motto}"</p>
                    <div class="guild-stats">
                        <span><i class="fa-solid fa-users"></i> ${memCount}/50 Üye</span>
                        <span><i class="fa-solid fa-layer-group"></i> 1. Seviye</span>
                    </div>
                    <button class="guild-join-btn" onclick="openJoinGuildModal('${guild.guildName}')"><i
                            class="fa-solid fa-magnifying-glass"></i> Loncayı İncele / Başvur</button>
                </div>
            `;
            gridContainer.insertAdjacentHTML('afterbegin', cardHTML);
        });
    };

    window.filterGuilds = (category) => {
        const guildCards = document.querySelectorAll('.guild-card');
        const filterBtns = document.querySelectorAll('#kulupler .academy-filter-btn');

        if (filterBtns.length > 0 && typeof event !== 'undefined' && event) {
            filterBtns.forEach(btn => btn.classList.remove('active'));
            if (event.currentTarget) event.currentTarget.classList.add('active');
        }

        guildCards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    };

    // --- GLOBAL ALANDA ÇALIŞAN KESİN LONCA FONKSİYONLARI ---
    window.openCreateGuildModal = () => {
        const modal = document.getElementById('create-guild-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
            modal.classList.add('active');
        }
    };

    window.closeCreateGuildModal = () => {
        const modal = document.getElementById('create-guild-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.classList.remove('active');
        }
    };

    window.openJoinGuildModal = (guildName) => {
        const customGuilds = JSON.parse(localStorage.getItem('asthenya_custom_guilds') || '[]');
        const guild = customGuilds.find(g => g.guildName === guildName);
        if (!guild) return;

        let members = guild.members || [];
        if (members.length === 0) {
            const ids = guild.discordIds || [guild.leader, 'üye1#1111', 'üye2#2222', 'üye3#3333', 'üye4#4444'];
            members = ids.map((id, idx) => {
                let role = 'Lonca Üyesi';
                if (idx === 0 || id === guild.leader) role = 'Lonca Lideri (Üstat)';
                else if (idx === 1) role = 'Lonca Başkan Yardımcısı';
                else if (idx === 2) role = 'Elit Savaşçı';
                else if (idx === 3) role = 'Kıdemli Büyücü';
                return { name: id, role: role };
            });
            guild.members = members;
            localStorage.setItem('asthenya_custom_guilds', JSON.stringify(customGuilds));
        }

        const modal = document.getElementById('guild-detail-modal');
        if (!modal) return;

        document.getElementById('guild-detail-name').textContent = guild.guildName;
        document.getElementById('guild-detail-type').textContent = guild.guildType.toUpperCase();
        document.getElementById('guild-detail-motto').textContent = `"${guild.motto}"`;
        document.getElementById('guild-detail-leader').textContent = guild.leader;
        document.getElementById('guild-detail-date').textContent = guild.date;
        document.getElementById('guild-detail-reason').textContent = guild.reason;

        const emblemEl = document.getElementById('guild-detail-emblem');
        if (emblemEl) emblemEl.innerHTML = `<i class="fa-solid ${guild.guildEmblem || 'fa-dragon'}"></i>`;

        const sessionStr = localStorage.getItem('asthenya_session');
        let currentUser = '';
        if (sessionStr) {
            try { currentUser = JSON.parse(sessionStr).username; } catch (e) { }
        }

        const isLeaderOrCo = members.some(m =>
            (m.name === currentUser || m.name.toLowerCase().includes(currentUser.toLowerCase()) || guild.leader.toLowerCase() === currentUser.toLowerCase() || currentUser === 'Admin' || currentUser === 'Metin') &&
            (m.role.includes('Lider') || m.role.includes('Yardımcı'))
        ) || guild.leader.toLowerCase() === currentUser.toLowerCase() || currentUser === 'Admin' || currentUser === 'Metin';

        const isAlreadyMember = members.some(m =>
            m.name === currentUser || m.name.toLowerCase().includes(currentUser.toLowerCase()) || guild.leader.toLowerCase() === currentUser.toLowerCase()
        ) || guild.leader.toLowerCase() === currentUser.toLowerCase() || currentUser === 'Admin' || currentUser === 'Metin';

        if (!isAlreadyMember) {
            window.openGuildApplyFormModal(guildName);
            return;
        }

        const memContainer = document.getElementById('guild-members-container');
        if (memContainer) {
            memContainer.innerHTML = members.map(m => {
                let badgeColor = '#94a3b8';
                let borderCol = 'rgba(255,255,255,0.05)';
                if (m.role.includes('Lider')) { badgeColor = 'var(--gold)'; borderCol = 'var(--gold)'; }
                else if (m.role.includes('Yardımcı')) { badgeColor = '#10b981'; borderCol = '#10b981'; }
                else if (m.role.includes('Elit') || m.role.includes('Kıdemli')) { badgeColor = '#a855f7'; borderCol = '#a855f7'; }

                let rankSelectHTML = '';
                if (isLeaderOrCo && m.name !== currentUser && !m.role.includes('Lider')) {
                    rankSelectHTML = `
                        <div style="margin-top: 10px; display: flex; gap: 6px; align-items: center;">
                            <select onchange="window.changeMemberRank('${guild.guildName}', '${m.name}', this.value)" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; font-family: 'Montserrat', sans-serif; cursor: pointer; flex: 1;">
                                <option value="">Rütbe Seç...</option>
                                <option value="Lonca Başkan Yardımcısı">Başkan Yardımcısı</option>
                                <option value="Elit Savaşçı">Elit Savaşçı</option>
                                <option value="Kıdemli Büyücü">Kıdemli Büyücü</option>
                                <option value="Lonca Üyesi">Lonca Üyesi</option>
                            </select>
                            <button onclick="window.kickGuildMember('${guild.guildName}', '${m.name}')" title="Üyeyi Loncadan At" style="background: rgba(255,68,68,0.2); border: 1px solid #ff4444; color: #ff4444; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;"><i class="fa-solid fa-user-minus"></i></button>
                        </div>
                    `;
                }

                return `
                    <div style="background: rgba(0,0,0,0.4); border: 1px solid ${borderCol}; border-left: 4px solid ${badgeColor}; padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; gap: 4px;">
                        <span style="color: #fff; font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.05rem;">${m.name}</span>
                        <span style="color: ${badgeColor}; font-size: 0.8rem; font-family: 'Montserrat', sans-serif; font-weight: 600;">${m.role}</span>
                        ${rankSelectHTML}
                    </div>
                `;
            }).join('');
        }

        const applySec = document.getElementById('guild-apply-section');
        const mgmtSec = document.getElementById('guild-management-section');

        if (applySec) {
            applySec.style.display = 'none'; // Üye/lider olan zaten başvuru butonunu görmemeli
        }

        if (mgmtSec) {
            if (isLeaderOrCo) {
                mgmtSec.style.display = 'block';
                window.renderGuildApplicants(guild.guildName);
            } else mgmtSec.style.display = 'none';
        }

        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('active');
    };

    window.closeGuildDetailModal = () => {
        const modal = document.getElementById('guild-detail-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.classList.remove('active');
        }
    };

    window.openGuildApplyFormModal = (guildName) => {
        const modal = document.getElementById('guild-apply-form-modal');
        if (!modal) return;

        const sessionStr = localStorage.getItem('asthenya_session');
        let currentUser = '';
        if (sessionStr) {
            try { currentUser = JSON.parse(sessionStr).username; } catch (e) { }
        }

        document.getElementById('apply-modal-guild-name').textContent = guildName;
        document.getElementById('apply-form-target-guild').value = guildName;
        if (currentUser) {
            const nameInput = document.getElementById('apply-char-name');
            if (nameInput) nameInput.value = currentUser;
        }

        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('active');
    };

    window.closeGuildApplyFormModal = () => {
        const modal = document.getElementById('guild-apply-form-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.classList.remove('active');
        }
    };

    window.submitExternalGuildApply = (e) => {
        e.preventDefault();
        const targetGuild = document.getElementById('apply-form-target-guild').value;
        const charName = document.getElementById('apply-char-name').value.trim();
        const discordId = document.getElementById('apply-discord-id').value.trim();
        const charClass = document.getElementById('apply-char-class').value;
        const reason = document.getElementById('apply-reason-text').value.trim();

        if (!targetGuild || !charName || !discordId) return;

        const applicantsObj = JSON.parse(localStorage.getItem('asthenya_guild_applicants') || '{}');
        if (!applicantsObj[targetGuild]) applicantsObj[targetGuild] = [];

        if (applicantsObj[targetGuild].some(a => a.name.toLowerCase() === charName.toLowerCase())) {
            alert('Bu birliğe zaten bir başvuru gönderdiniz! Lonca Liderinin kararını bekleyiniz.');
            return;
        }

        applicantsObj[targetGuild].push({
            id: Date.now(),
            name: charName,
            discordId: discordId,
            charClass: charClass,
            reason: reason,
            date: new Date().toLocaleDateString('tr-TR')
        });

        localStorage.setItem('asthenya_guild_applicants', JSON.stringify(applicantsObj));
        alert(`"${targetGuild}" birliğine katılım talebiniz Yüce Konsey aracılığıyla iletildi! Lider veya Yardımcı başvurunuzu değerlendirecektir.`);
        window.closeGuildApplyFormModal();
        document.getElementById('external-guild-apply-form').reset();
    };

    window.openMyGuildModal = () => {
        const sessionStr = localStorage.getItem('asthenya_session');
        let currentUser = '';
        if (sessionStr) {
            try { currentUser = JSON.parse(sessionStr).username; } catch (e) { }
        }

        if (!currentUser) {
            alert('Loncana erişebilmek için önce diyarda oturum açmalısın!');
            return;
        }

        const customGuilds = JSON.parse(localStorage.getItem('asthenya_custom_guilds') || '[]');
        const myGuild = customGuilds.find(g =>
            g.leader.toLowerCase() === currentUser.toLowerCase() ||
            (g.members && g.members.some(m => m.name.toLowerCase().includes(currentUser.toLowerCase()))) ||
            currentUser === 'Admin' || currentUser === 'Metin'
        );

        if (myGuild) {
            window.openJoinGuildModal(myGuild.guildName);
        } else {
            alert("Şu anda kayıtlı veya lideri olduğunuz aktif bir lonca bulunmamaktadır! Önce 'Lonca / Kulüp Kur' butonundan bir birlik oluşturun veya mevcut loncalardan birine başvurun.");
        }
    };

    window.changeMemberRank = (guildName, memberName, newRank) => {
        if (!newRank) return;
        const customGuilds = JSON.parse(localStorage.getItem('asthenya_custom_guilds') || '[]');
        const guild = customGuilds.find(g => g.guildName === guildName);
        if (!guild || !guild.members) return;

        const member = guild.members.find(m => m.name === memberName);
        if (member) {
            member.role = newRank;
            localStorage.setItem('asthenya_custom_guilds', JSON.stringify(customGuilds));
            alert(`"${memberName}" isimli savaşçının rütbesi "${newRank}" olarak güncellendi!`);
            window.openJoinGuildModal(guildName);
        }
    };

    window.kickGuildMember = (guildName, memberName) => {
        if (!confirm(`"${memberName}" isimli savaşçıyı loncadan atmak istediğinize emin misiniz?`)) return;
        const customGuilds = JSON.parse(localStorage.getItem('asthenya_custom_guilds') || '[]');
        const guild = customGuilds.find(g => g.guildName === guildName);
        if (!guild || !guild.members) return;

        guild.members = guild.members.filter(m => m.name !== memberName);
        localStorage.setItem('asthenya_custom_guilds', JSON.stringify(customGuilds));
        alert(`"${memberName}" isimli savaşçı loncadan atıldı.`);
        window.openJoinGuildModal(guildName);
    };

    window.renderGuildApplicants = (guildName) => {
        const applicantsObj = JSON.parse(localStorage.getItem('asthenya_guild_applicants') || '{}');
        const list = applicantsObj[guildName] || [];
        const container = document.getElementById('guild-applicants-container');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = '<div style="color: #64748b; font-style: italic; font-size: 0.9rem; padding: 1rem 0;">Henüz bu loncaya yapılmış dış bir başvuru bulunmuyor.</div>';
            return;
        }

        container.innerHTML = list.map(app => `
            <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem;">
                    <div>
                        <div style="color: #fff; font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                            ${app.name} <span style="background: rgba(223,183,84,0.2); color: var(--gold); font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-family: 'Montserrat', sans-serif;">${app.charClass || 'Savaşçı'}</span>
                        </div>
                        <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 6px;"><i class="fa-brands fa-discord" style="color: #5865F2;"></i> Discord: <strong style="color: #fff;">${app.discordId || 'Belirtilmedi'}</strong></div>
                        <div style="color: #64748b; font-size: 0.8rem; margin-top: 4px;"><i class="fa-solid fa-calendar-days"></i> Başvuru Tarihi: ${app.date}</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.acceptGuildApplicant('${guildName}', ${app.id})" style="background: #10b981; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-family: 'Cinzel', serif; font-weight: bold; font-size: 0.85rem; box-shadow: 0 0 15px rgba(16,185,129,0.3);"><i class="fa-solid fa-check"></i> Kabul Et</button>
                        <button onclick="window.rejectGuildApplicant('${guildName}', ${app.id})" style="background: #ff4444; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-family: 'Cinzel', serif; font-weight: bold; font-size: 0.85rem; box-shadow: 0 0 15px rgba(255,68,68,0.3);"><i class="fa-solid fa-xmark"></i> Reddet</button>
                    </div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--gold); font-family: 'Montserrat', sans-serif; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">
                    <strong style="color: var(--gold); font-family: 'Cinzel', serif; font-size: 0.85rem; display: block; margin-bottom: 6px;"><i class="fa-solid fa-pen-nib"></i> KATILIM AMACI VE TECRÜBE:</strong>
                    "${app.reason || 'Belirtilmedi.'}"
                </div>
            </div>
        `).join('');
    };

    window.acceptGuildApplicant = (guildName, appId) => {
        const applicantsObj = JSON.parse(localStorage.getItem('asthenya_guild_applicants') || '{}');
        const list = applicantsObj[guildName] || [];
        const app = list.find(a => a.id === appId);
        if (!app) return;

        const customGuilds = JSON.parse(localStorage.getItem('asthenya_custom_guilds') || '[]');
        const guild = customGuilds.find(g => g.guildName === guildName);
        if (guild) {
            if (!guild.members) guild.members = [];
            guild.members.push({ name: app.name, role: 'Lonca Üyesi' });
            localStorage.setItem('asthenya_custom_guilds', JSON.stringify(customGuilds));
        }

        applicantsObj[guildName] = list.filter(a => a.id !== appId);
        localStorage.setItem('asthenya_guild_applicants', JSON.stringify(applicantsObj));

        alert(`"${app.name}" isimli savaşçı loncanıza resmi olarak kabul edildi!`);
        window.openJoinGuildModal(guildName);
    };

    window.rejectGuildApplicant = (guildName, appId) => {
        const applicantsObj = JSON.parse(localStorage.getItem('asthenya_guild_applicants') || '{}');
        const list = applicantsObj[guildName] || [];
        const app = list.find(a => a.id === appId);
        if (!app) return;

        applicantsObj[guildName] = list.filter(a => a.id !== appId);
        localStorage.setItem('asthenya_guild_applicants', JSON.stringify(applicantsObj));

        alert(`"${app.name}" isimli savaşçının lonca başvurusu reddedildi.`);
        window.openJoinGuildModal(guildName);
    };

    window.closeGuildWarningModal = () => {
        const modal = document.getElementById('guild-warning-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.classList.remove('active');
        }
    };

    window.closeGuildSuccessModal = () => {
        const modal = document.getElementById('guild-success-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            modal.classList.remove('active');
        }
    };

    window.submitGuildApplication = (e) => {
        if (e) e.preventDefault();

        const guildNameEl = document.getElementById('guild-name');
        const guildTypeEl = document.getElementById('guild-type');
        const guildEmblemEl = document.getElementById('guild-emblem-select');
        const guildLeaderEl = document.getElementById('guild-leader-name');
        const guildMottoEl = document.getElementById('guild-motto-text');
        const guildReasonEl = document.getElementById('guild-reason');
        const discordIdsEl = document.getElementById('guild-discord-ids');

        if (!guildNameEl || !guildLeaderEl) return;

        const guildName = guildNameEl.value.trim();
        const guildType = guildTypeEl ? guildTypeEl.value : 'combat';
        const guildEmblem = guildEmblemEl ? guildEmblemEl.value : 'fa-dragon';
        const guildLeader = guildLeaderEl.value.trim();
        const guildMotto = guildMottoEl ? guildMottoEl.value.trim() : '';
        const guildReason = guildReasonEl ? guildReasonEl.value.trim() : '';
        const discordIdsRaw = discordIdsEl ? discordIdsEl.value.trim() : '';
        const discordIds = discordIdsRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

        if (discordIds.length < 1) {
            window.closeCreateGuildModal();
            const warnModal = document.getElementById('guild-warning-modal');
            if (warnModal) {
                warnModal.style.display = 'flex';
                warnModal.style.opacity = '1';
                warnModal.style.visibility = 'visible';
                warnModal.classList.add('active');
            }
            return;
        }

        const newApplication = {
            id: Date.now(),
            guildName: guildName,
            guildType: guildType,
            guildEmblem: guildEmblem,
            leader: guildLeader,
            motto: guildMotto,
            reason: guildReason,
            discordIds: discordIds,
            date: new Date().toLocaleString('tr-TR'),
            status: 'Beklemede'
        };

        const existingApps = JSON.parse(localStorage.getItem('asthenya_guild_applications') || '[]');
        existingApps.unshift(newApplication);
        localStorage.setItem('asthenya_guild_applications', JSON.stringify(existingApps));

        window.closeCreateGuildModal();
        const successModal = document.getElementById('guild-success-modal');
        if (successModal) {
            successModal.style.display = 'flex';
            successModal.style.opacity = '1';
            successModal.style.visibility = 'visible';
            successModal.classList.add('active');
        }

        const form = document.getElementById('guild-create-form');
        if (form) form.reset();
    };

    // ESC ve Dış tıklama ile kapatma
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeCreateGuildModal();
            window.closeGuildSuccessModal();
            window.closeGuildWarningModal();
            window.closeGuildDetailModal();
        }
    });

    document.addEventListener('click', (e) => {
        const createModal = document.getElementById('create-guild-modal');
        const successModal = document.getElementById('guild-success-modal');
        const warningModal = document.getElementById('guild-warning-modal');

        if (createModal && e.target === createModal) window.closeCreateGuildModal();
        if (successModal && e.target === successModal) window.closeGuildSuccessModal();
        if (warningModal && e.target === warningModal) window.closeGuildWarningModal();
    });

    // --- BÜYÜK PAZAR ALANI (GRAND BAZAAR / MARKETPLACE) VERİTABANI & İŞLEMLERİ ---
    const defaultMarketItems = [
        {
            id: "item1", category: "weapons", rarityClass: "legendary", rarityName: "★ Efsanevi",
            emblem: '<i class="fa-solid fa-khanda"></i>',
            title: "Gök Gürültüsü Kılıcı",
            seller: "Usta Demirci Borin",
            motto: "Göğün gazabını çeliğe mühürledim.",
            stats: ["+85 Saldırı Gücü", "+30 Yıldırım Hasarı", "%15 Kritik Şansı"],
            price: "2,450",
            lore: "İlk usta Thorgrın'in kutsal örsünden çıkan, fırtına bulutlarının saf enerjisiyle dövülmüş kadim bir kılıç. Her savruluşunda gök gürültüsü diyarın derinliklerinde yankılanır."
        },
        {
            id: "item2", category: "armor", rarityClass: "epic", rarityName: "✦ Epik",
            emblem: '<i class="fa-solid fa-shield-halved"></i>',
            title: "Ejder Kanı Zırhı",
            seller: "Komutan Vaelor",
            motto: "Ateşin kendisi bile bu pulları eritemez.",
            stats: ["+120 Zırh", "+50 Büyü Direnci", "%25 Ateş Koruması"],
            price: "1,800",
            lore: "Ejder tanrıçası Malafez'in düşen yakut pullarından zanaat edilmiş, ağır ve ihtişamlı bir göğüslük. Savaş meydanında sahibini alevlerin ve magmanın gazabından korur."
        },
        {
            id: "item3", category: "alchemy", rarityClass: "rare", rarityName: "Üstat İşi",
            emblem: '<i class="fa-solid fa-flask-vial"></i>',
            title: "Yıldız Gezen İksiri",
            seller: "Simyacı Lyra",
            motto: "Bir yudumda galaksileri adımla.",
            stats: ["+100 Hız (10 dk)", "Gece Görüşü", "Sıfır Yerçekimi Sıçraması"],
            price: "650",
            lore: "Miu'nun yıldız tozlarından damıtılmış, şişenin içinde küçük bir galaksi gibi parıldayan kozmik bir iksir. İçen kişiye rüzgarın ötesinde bir hız ve çeviklik bahşeder."
        },
        {
            id: "item4", category: "relics", rarityClass: "legendary", rarityName: "★ Efsanevi",
            emblem: '<i class="fa-solid fa-gem"></i>',
            title: "Kayıp Ruhlar Feneri",
            seller: "Karanlık Tüccar Kael",
            motto: "Gölgeler bile bu ışığın önünde eğilir.",
            stats: ["Ruh Saptama (Pasif)", "+40 Büyü Gücü", "Karanlık Görüşü"],
            price: "3,100",
            lore: "Osentha'nın sürgünler diyarından getirilmiş, içinde ebedi bir mavi alev yanan kadim fener. Zindanların en derin karanlığında bile yol gösterir ve gizlenmiş hayaletleri açığa çıkarır."
        },
        {
            id: "item5", category: "scrolls", rarityClass: "epic", rarityName: "✦ Epik",
            emblem: '<i class="fa-solid fa-scroll"></i>',
            title: "Zaman Bükücü Parşömeni",
            seller: "Kahin Elyse",
            motto: "Zamanı 5 saniye geriye sar.",
            stats: ["Tek Kullanımlık", "Krono-Geri Sarma", "Ölümden Dönüş"],
            price: "1,500",
            lore: "Merinos'un kehanet iplikleriyle dokunmuş, ölümcül bir darbe aldığınızda zamanı 5 saniye geriye alarak kaderi yeniden yazmanızı sağlayan kadim parşömen."
        },
        {
            id: "item6", category: "weapons", rarityClass: "legendary", rarityName: "★ Efsanevi",
            emblem: '<i class="fa-solid fa-wand-magic-sparkles"></i>',
            title: "Gümüş Göz Asası",
            seller: "Archmage Seraphina",
            motto: "Gerçeğin ışığı her yalanı delip geçer.",
            stats: ["+110 Büyü Gücü", "+50 Mana Yenileme", "%20 Büyü Hızı"],
            price: "2,900",
            lore: "Gümüş Göz Cemiyetinin ulu büyücüsü Seraphina tarafından mühürlenmiş, ucunda yüzen saf gümüş kristaliyle en karmaşık büyüleri anında dokuyan asa."
        },
        {
            id: "item7", category: "armor", rarityClass: "epic", rarityName: "✦ Epik",
            emblem: '<i class="fa-solid fa-shield"></i>',
            title: "Titan Çeliği Kalkanı",
            seller: "Usta Borin",
            motto: "Dağlar yıkılır, bu kalkan sarsılmaz.",
            stats: ["+150 Bloklama", "Sarsılmazlık Buffı", "%10 Fiziksel Yansıtma"],
            price: "1,650",
            lore: "Örs ve Çekiç İttifakının en usta demircileri tarafından volkanik lavlarda soğutulmuş, devasa kule kalkanı. Bir kalenin ana kapısı kadar sağlamdır."
        },
        {
            id: "item8", category: "alchemy", rarityClass: "rare", rarityName: "Üstat İşi",
            emblem: '<i class="fa-solid fa-flask-vial"></i>',
            title: "Yaşam Özü İksiri",
            seller: "Şifacı Elora",
            motto: "Ölümün kıyısından anında dönüş.",
            stats: ["%100 Can Yenileme", "Tüm Zehirleri Temizleme", "+20 Can Regen (5 dk)"],
            price: "500",
            lore: "Yaşam Tanrıçası Xanax'ın kutsal pınarlarından doldurulmuş, en ağır yaraları ve lanetleri saniyeler içinde iyileştiren efsanevi nektar."
        }
    ];

    let marketItems = JSON.parse(localStorage.getItem('asthenya_market_items') || 'null');
    if (!marketItems || marketItems.length === 0) {
        marketItems = defaultMarketItems;
        localStorage.setItem('asthenya_market_items', JSON.stringify(marketItems));
    }



    let currentSelectedItem = null;

    // Pazar İlanlarını HTML'e Render Etme
    const marketGridContainer = document.getElementById('market-grid-container');
    if (marketGridContainer) {
        let marketHTML = '';
        marketItems.forEach(item => {
            let statsHTML = '';
            item.stats.forEach(st => {
                statsHTML += `<span><i class="fa-solid fa-wand-magic-sparkles"></i> ${st}</span>`;
            });

            marketHTML += `
                <div class="market-card" data-category="${item.category}">
                    <div class="market-card-glow"></div>
                    <div class="market-badge ${item.rarityClass}">${item.rarityName}</div>
                    <div class="market-emblem">${item.emblem}</div>
                    <h3 class="market-title">${item.title}</h3>
                    <div class="market-seller"><i class="fa-solid fa-user-tie"></i> Satıcı: <span>${item.seller}</span></div>
                    <p class="market-motto">"${item.motto}"</p>
                    <div class="market-stats">
                        ${statsHTML}
                    </div>
                    <div class="market-price"><i class="fa-solid fa-coins"></i> ${item.price} Altın</div>
                    <div class="market-actions">
                        <button class="market-btn inspect" onclick="openMarketDetailModal('${item.id}')"><i class="fa-solid fa-magnifying-glass"></i> İncele</button>
                        <button class="market-btn buy" onclick="initiateMarketBuy('${item.id}')"><i class="fa-solid fa-bag-shopping"></i> Satın Al</button>
                    </div>
                </div>
            `;
        });
        marketGridContainer.innerHTML = marketHTML;
    }

    // Pazar Filtreleme
    window.filterMarket = (category) => {
        const marketCards = document.querySelectorAll('.market-card');
        const filterBtns = document.querySelectorAll('#pazar .academy-filter-btn');

        if (filterBtns.length > 0 && event) {
            filterBtns.forEach(btn => btn.classList.remove('active'));
            event.currentTarget.classList.add('active');
        }

        marketCards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    };

    // İlan İnceleme Modalı Aç/Kapat
    window.openMarketDetailModal = (itemId) => {
        const item = marketItems.find(i => i.id === itemId);
        const modal = document.getElementById('market-detail-modal');
        if (!item || !modal) return;

        currentSelectedItem = item;

        document.getElementById('market-detail-emblem').innerHTML = item.emblem;
        document.getElementById('market-detail-badge').className = `market-badge ${item.rarityClass}`;
        document.getElementById('market-detail-badge').innerText = item.rarityName;
        document.getElementById('market-detail-title').innerText = item.title;
        document.getElementById('market-detail-seller-name').innerText = item.seller;
        document.getElementById('market-detail-lore').innerText = item.lore;
        document.getElementById('market-detail-price-val').innerText = `${item.price} Altın`;

        const statsList = document.getElementById('market-detail-stats-list');
        if (statsList) {
            statsList.innerHTML = item.stats.map(st => `<span><i class="fa-solid fa-wand-magic-sparkles"></i> ${st}</span>`).join('');
        }

        modal.classList.add('active');

        // İnceleme Sesi
        let inspectSound = new Audio('https://actions.google.com/sounds/v1/science_fiction/sci_fi_hum.ogg');
        inspectSound.volume = 0.4;
        inspectSound.play().catch(e => console.log('Audio error:', e));
    };

    window.closeMarketDetailModal = () => {
        const modal = document.getElementById('market-detail-modal');
        if (modal) modal.classList.remove('active');
    };

    // Satın Alma Modalı Başlatma
    window.initiateMarketBuy = (itemId) => {
        const item = marketItems.find(i => i.id === itemId);
        if (!item) return;
        currentSelectedItem = item;
        openMarketBuyModal();
    };

    window.openMarketBuyModal = () => {
        closeMarketDetailModal(); // Varsa detay modalını kapat
        const modal = document.getElementById('market-buy-modal');
        if (modal) modal.classList.add('active');
    };

    window.closeMarketBuyModal = () => {
        const modal = document.getElementById('market-buy-modal');
        if (modal) modal.classList.remove('active');
    };

    window.confirmMarketPurchase = () => {
        if (!currentSelectedItem) return;
        closeMarketBuyModal();

        // Satın alma sesi (Altın şıngırtısı)
        let coinSound = new Audio('https://actions.google.com/sounds/v1/tools/ratchet_clicking.ogg');
        coinSound.volume = 0.7;
        coinSound.play().catch(e => console.log('Audio error:', e));

        alert(`Tebrikler! "${currentSelectedItem.title}" eşyasını ${currentSelectedItem.price} Altın karşılığında başarıyla satın aldınız. Ganimet envanterinize eklendi!`);
    };

    window.makeMarketOffer = () => {
        if (!currentSelectedItem) return;
        const offer = prompt(`"${currentSelectedItem.title}" için satıcı ${currentSelectedItem.seller} kişisine teklifiniz nedir? (Altın cinsinden girin):`, currentSelectedItem.price);
        if (offer && !isNaN(offer) && offer > 0) {
            closeMarketBuyModal();
            alert(`${offer} Altın teklifiniz satıcı ${currentSelectedItem.seller} kişisine rünik uyarısıyla iletildi! Satıcının cevabı mesaj kutunuza düşecektir.`);
        } else if (offer !== null) {
            alert('Lütfen geçerli bir altın teklifi girin.');
        }
    };

    // Tezgah Kurma (İlan Ekleme) Modalı Aç/Kapat
    window.openCreateMarketModal = () => {
        const modal = document.getElementById('create-market-modal');
        if (modal) modal.classList.add('active');
    };

    window.closeCreateMarketModal = () => {
        const modal = document.getElementById('create-market-modal');
        if (modal) modal.classList.remove('active');
    };

    window.submitMarketListing = (e) => {
        e.preventDefault();

        // Form verilerini alıp yeni kart olarak ekleme
        const nameInput = document.getElementById('market-item-name');
        const catSelect = document.getElementById('market-item-category');
        const raritySelect = document.getElementById('market-item-rarity');
        const sellerInput = document.getElementById('market-seller-name');
        const priceInput = document.getElementById('market-item-price');
        const mottoInput = document.getElementById('market-item-motto');
        const statsInput = document.getElementById('market-item-stats');
        const loreInput = document.getElementById('market-item-lore');

        if (nameInput && catSelect && raritySelect && sellerInput && priceInput && mottoInput && statsInput && loreInput) {
            const rarityNames = {
                legendary: "★ Efsanevi",
                epic: "✦ Epik",
                rare: "Üstat İşi"
            };

            const emblems = {
                weapons: '<i class="fa-solid fa-khanda"></i>',
                armor: '<i class="fa-solid fa-shield-halved"></i>',
                alchemy: '<i class="fa-solid fa-flask-vial"></i>',
                scrolls: '<i class="fa-solid fa-scroll"></i>',
                relics: '<i class="fa-solid fa-gem"></i>'
            };

            const newItem = {
                id: "item_custom_" + Date.now(),
                category: catSelect.value,
                rarityClass: raritySelect.value,
                rarityName: rarityNames[raritySelect.value],
                emblem: emblems[catSelect.value],
                title: nameInput.value,
                seller: sellerInput.value,
                motto: mottoInput.value,
                stats: statsInput.value.split(',').map(s => s.trim()),
                price: parseInt(priceInput.value).toLocaleString(),
                lore: loreInput.value
            };

            marketItems.unshift(newItem); // En başa ekle
            localStorage.setItem('asthenya_market_items', JSON.stringify(marketItems));

            // Grid'i tekrar render et
            const marketGridContainer = document.getElementById('market-grid-container');
            if (marketGridContainer) {
                let statsHTML = '';
                newItem.stats.forEach(st => {
                    statsHTML += `<span><i class="fa-solid fa-wand-magic-sparkles"></i> ${st}</span>`;
                });

                const newCardHTML = `
                    <div class="market-card" data-category="${newItem.category}">
                        <div class="market-card-glow"></div>
                        <div class="market-badge ${newItem.rarityClass}">${newItem.rarityName}</div>
                        <div class="market-emblem">${newItem.emblem}</div>
                        <h3 class="market-title">${newItem.title}</h3>
                        <div class="market-seller"><i class="fa-solid fa-user-tie"></i> Satıcı: <span>${newItem.seller}</span></div>
                        <p class="market-motto">"${newItem.motto}"</p>
                        <div class="market-stats">
                            ${statsHTML}
                        </div>
                        <div class="market-price"><i class="fa-solid fa-coins"></i> ${newItem.price} Altın</div>
                        <div class="market-actions">
                            <button class="market-btn inspect" onclick="openMarketDetailModal('${newItem.id}')"><i class="fa-solid fa-magnifying-glass"></i> İncele</button>
                            <button class="market-btn buy" onclick="initiateMarketBuy('${newItem.id}')"><i class="fa-solid fa-bag-shopping"></i> Satın Al</button>
                        </div>
                    </div>
                `;

                marketGridContainer.insertAdjacentHTML('afterbegin', newCardHTML);
            }

            // Formu sıfırla ve kapat
            document.getElementById('market-create-form').reset();
            closeCreateMarketModal();

            // Başarı modalını aç
            const successModal = document.getElementById('market-success-modal');
            if (successModal) successModal.classList.add('active');
        }
    };

    window.closeMarketSuccessModal = () => {
        const modal = document.getElementById('market-success-modal');
        if (modal) modal.classList.remove('active');
    };

    // Pazar Modallarını ESC ve Dış Tık ile Kapatma
    const createMarketModal = document.getElementById('create-market-modal');
    const successMarketModal = document.getElementById('market-success-modal');
    const detailMarketModal = document.getElementById('market-detail-modal');
    const buyMarketModal = document.getElementById('market-buy-modal');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (createMarketModal && createMarketModal.classList.contains('active')) closeCreateMarketModal();
            if (successMarketModal && successMarketModal.classList.contains('active')) closeMarketSuccessModal();
            if (detailMarketModal && detailMarketModal.classList.contains('active')) closeMarketDetailModal();
            if (buyMarketModal && buyMarketModal.classList.contains('active')) closeMarketBuyModal();
        }
    });

    if (createMarketModal) {
        createMarketModal.addEventListener('click', (e) => {
            if (e.target === createMarketModal) closeCreateMarketModal();
        });
    }
    if (successMarketModal) {
        successMarketModal.addEventListener('click', (e) => {
            if (e.target === successMarketModal) closeMarketSuccessModal();
        });
    }
    if (detailMarketModal) {
        detailMarketModal.addEventListener('click', (e) => {
            if (e.target === detailMarketModal) closeMarketDetailModal();
        });
    }
    if (buyMarketModal) {
        buyMarketModal.addEventListener('click', (e) => {
            if (e.target === buyMarketModal) closeMarketBuyModal();
        });
    }

    // --- ASTHENYA DÜNYA HARİTASI (WORLD MAP) ETKİLEŞİM İŞLEMLERİ (YENİ KUSURSUZ SÜRÜM) ---
    const mapViewport = document.getElementById('map-viewport');
    const mapLayer = document.getElementById('map-content-layer');
    const mapImageWrapper = document.getElementById('map-image-wrapper');
    const zoomInBtn = document.getElementById('map-zoom-in');
    const zoomOutBtn = document.getElementById('map-zoom-out');
    const zoomResetBtn = document.getElementById('map-zoom-reset');

    // Değişkenleri ve fonksiyonları openMapLocationModal'ın erişebileceği scope'ta tanımlıyoruz
    let currentZoom = 1;
    let translateX = 0, translateY = 0;
    let updateMapTransform = (isSmooth = false) => {
        if (!mapLayer) return;
        if (isSmooth) {
            mapLayer.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        } else {
            mapLayer.style.transition = 'none';
        }
        mapLayer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    };

    if (mapViewport && mapLayer) {
        let isDragging = false;
        let startX = 0, startY = 0;



        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (currentZoom < 4) {
                    currentZoom += 0.3;
                    updateMapTransform(true);
                }
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (currentZoom > 0.5) {
                    currentZoom -= 0.3;
                    updateMapTransform(true);
                }
            });
        }

        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                currentZoom = 1;
                translateX = 0;
                translateY = 0;
                updateMapTransform(true);
            });
        }

        if (mapImageWrapper) {
            mapImageWrapper.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                mapLayer.style.transition = 'none'; // Sürükleme başlarken transition'ı sıfırla
            });
        }

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateMapTransform(false); // Sürüklerken gecikmesiz anında takip
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Mouse tekerleği (wheel) ile yakınlaştırma/uzaklaştırma
        mapViewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                if (currentZoom < 4) currentZoom += 0.15;
            } else {
                if (currentZoom > 0.5) currentZoom -= 0.15;
            }
            updateMapTransform(false); // Wheel ile anında tepki
        }, { passive: false });
    }

    // --- HARİTA KONUM MODALI YÖNETİMİ (GLOBAL LORE POPUP) ---
    const mapLocationsLore = {
        bladion: {
            title: "BLADION GECE KRALLIĞI",
            subtitle: "Sonsuz Karanlık ve Volkanik Kaleler Diyarı",
            lore: "Kıtanın kuzeybatısındaki sarp volkanik dağların eteklerine kurulan Bladion, güneşin nadiren yüzünü gösterdiği efsanevi bir gece krallığıdır. Lav nehirleriyle korunan devasa kalelerinde, karanlık büyülerde ustalaşmış gece şövalyeleri ve ateş rünleri işleyen efsanevi demirciler hüküm sürer.",
            icon: "fa-moon",
            image: "img/map/Bladion Gece Toprakları.png",
            x: 19, y: 23.5
        },
        meclis: {
            title: "ON İKİ KADİM BAŞBÜYÜCÜ MECLİSİ",
            subtitle: "Büyünün Kalbi ve Kristal Kuleler",
            lore: "Asthenya kıtasının en yüksek zirvesinde yer alan bu ihtişamlı mavi kristal şehir, kıtanın büyü akışını denetleyen On İki Kadim Başbüyücü'nün konsey merkezidir. Göklerden süzülen saf mana nehirleri, buradaki efsanevi kuleleri ve rünik kütüphaneleri sonsuz bir enerjiyle besler.",
            icon: "fa-wand-magic-sparkles",
            image: "img/map/On İki Baş Büyücü.png",
            x: 48.5, y: 23.5
        },
        yikim: {
            title: "YIKIM ORMANI - TANRI'NIN MAHZENİ",
            subtitle: "Kadim Lanetler ve Terk Edilmiş Tapınaklar",
            lore: "Kıtanın kuzeydoğusunda, asırlık dev ağaçların gölgesinde gizlenen Yıkım Ormanı, efsaneye göre kadim bir tanrının hapsedildiği devasa mahzene ev sahipliği yapar. Sadece en cesur ve elit maceracılar, buradaki lanetli zindanlara girip efsanevi titan ganimetlerini arama cesaretini gösterebilir.",
            icon: "fa-skull-crossbones",
            image: "img/map/Yıkım Mahzeni.png",
            x: 81, y: 23.5
        },
        azure: {
            title: "AZURE KRALLIĞI",
            subtitle: "Mavi Çatılı Saraylar ve Şövalyeler Diyarı",
            lore: "Masal kitaplarından fırlamış gibi duran masmavi kuleleri ve görkemli şövalye birlikleriyle Azure Krallığı, kıtanın en büyük düzen ve adalet savunucusudur. Nehir boylarına kurulan verimli toprakları ve efsanevi şövalye akademileriyle kıtanın askeri gücünün belkemiğini oluşturur.",
            icon: "fa-shield-halved",
            image: "img/map/azure krallığı.png",
            x: 13, y: 53.5
        },
        lemartha: {
            title: "LEMARTHA KUTSAL KRALLIĞI",
            subtitle: "Kıtanın Altın Kalbi ve Işık Çemberi",
            lore: "Asthenya kıtasının tam merkezinde, iç içe geçmiş devasa dairesel surlarla korunan Lemartha, kıtanın kutsal başkentidir. Merkezindeki devasa Altın Saray, tanrıların yeryüzündeki gölgesi olarak kabul edilir. Kıtanın en büyük ticaret yolları ve diplomatik görüşmeleri bu efsanevi çemberde gerçekleşir.",
            icon: "fa-crown",
            image: "img/map/Lemartha Kutsal Krallık.png",
            x: 48.5, y: 65.5
        },
        querparta: {
            title: "QUERPARTA",
            subtitle: "Efsanevi Liman Şehri ve Korsan Loncaları",
            lore: "Kıtanın güneybatı kıyılarını kaplayan Querparta, devasa kalyonların, efsanevi denizcilerin ve tüccar loncalarının buluşma noktasıdır. Okyanusun derinliklerinden çıkarılan nadide deniz rünleri ve kadim batık ganimetleri burada satılır. Şehrin gece hayatı ve gizli ticaret masaları meşhurdur.",
            icon: "fa-anchor",
            image: "img/map/kavi.png",
            x: 12.5, y: 93.5
        },
        dragian: {
            title: "DRAGIAN",
            subtitle: "Ejder Kalesi ve Ateşin Hükümdarları",
            lore: "Güneyin kavurucu lav denizlerinin ortasında yükselen Dragian, devasa ejderhaların evcilleştirildiği ve eğitildiği volkanik bir kaledir. Kalenin zirvesindeki Efsanevi Kızıl Ejder, şehri yaklaşan tüm tehlikelere karşı korur. Ejderha derisi zırhlar sadece bu kalenin usta demircileri tarafından dövülebilir.",
            icon: "fa-dragon",
            image: "img/map/Dragian.png",
            x: 55.5, y: 94.5
        },
        espanyan: {
            title: "YAŞAM ORMANI - ESPANYAN",
            subtitle: "Kutsal Zümrüt Pınarı ve Kadim Elfler",
            lore: "Kıtanın güneydoğusunu saran turkuaz parıltılı Yaşam Ormanı Espanyan, doğanın ve yaşam enerjisinin en saf halini barındırır. Ormanın merkezindeki Kutsal Yaşam Sunağı, ölümcül yaraları iyileştiren ve efsanevi şifa iksirlerinin özünü oluşturan kutsal sularla doludur. Buradaki kadim elfler kıtanın en büyük bilgeleridir.",
            icon: "fa-tree",
            image: "img/map/Elf.png",
            x: 85, y: 78.5
        }
    };

    window.openMapLocationModal = (key) => {
        const data = mapLocationsLore[key];
        if (!data) return;

        // --- HARİTAYI ODAKLAMA MANTIĞI (AUTO-PAN) ---
        if (data.x !== undefined && data.y !== undefined && mapLayer && mapImageWrapper) {
            const wrapperWidth = mapImageWrapper.offsetWidth;
            const wrapperHeight = mapImageWrapper.offsetHeight;

            // Koordinatları merkeze göre hesapla (Flexbox centering olduğu için 0.5 referans alınır)
            translateX = (0.5 - (data.x / 100)) * wrapperWidth * currentZoom;
            translateY = (0.5 - (data.y / 100)) * wrapperHeight * currentZoom;

            updateMapTransform(true); // Akıcı bir şekilde oraya kaydır
        }

        const modal = document.getElementById('map-location-modal');
        const titleEl = document.getElementById('location-modal-title');
        const subtitleEl = document.getElementById('location-modal-subtitle');
        const loreEl = document.getElementById('location-modal-lore');
        const emblemEl = document.getElementById('location-modal-emblem');
        const imgContainerEl = document.getElementById('location-modal-img-container');
        const imgEl = document.getElementById('location-modal-img');

        if (modal && titleEl && subtitleEl && loreEl && emblemEl) {
            titleEl.innerText = data.title;
            subtitleEl.innerText = data.subtitle;
            loreEl.innerText = data.lore;
            emblemEl.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;

            if (data.image && imgContainerEl && imgEl) {
                imgEl.src = data.image;
                imgContainerEl.style.display = 'block';
            } else if (imgContainerEl) {
                imgContainerEl.style.display = 'none';
            }

            modal.classList.add('active');
        }
    };

    window.closeMapLocationModal = () => {
        const modal = document.getElementById('map-location-modal');
        if (modal) modal.classList.remove('active');
    };

    // --- Varsayılan Yetkili Hesap Oluşturma ---
    function initializeDefaultAdmin() {
        let users = JSON.parse(localStorage.getItem('asthenya_users') || '[]');
        const yodaExists = users.some(u => u.username === 'Yoda');

        if (!yodaExists) {
            users.push({
                username: 'Yoda',
                password: 'Mert.Mert123',
                role: 'DEVELOPER',
                race: 'Kozmik',
                level: 99,
                id: 'yoda_' + Date.now()
            });
            localStorage.setItem('asthenya_users', JSON.stringify(users));
        }
    }

    // --- Giriş / Kayıt Mantığı ---
    const joinForm = document.querySelector('.join-form');
    if (joinForm) {
        joinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = joinForm.querySelector('input[type="text"]');
            const passwordInput = joinForm.querySelector('input[type="password"]');
            const discordInput = document.getElementById('join-discord-id');

            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const discordId = discordInput ? discordInput.value.trim() : '';

            let users = JSON.parse(localStorage.getItem('asthenya_users') || '[]');
            const existingUser = users.find(u => u.username === username);

            if (existingUser) {
                // Giriş Denemesi
                if (existingUser.password === password) {
                    if (discordId && existingUser.discordId !== discordId) {
                        existingUser.discordId = discordId;
                        localStorage.setItem('asthenya_users', JSON.stringify(users));
                    }
                    localStorage.setItem('asthenya_logged_in_user', JSON.stringify(existingUser));
                    alert(`Hoş geldin, ${username}! Oturumun açıldı.`);
                    checkAdminAccess();
                    syncUserIdentities();
                } else {
                    alert('Hatalı şifre! Kadim mühür çözülemedi.');
                }
            } else {
                // Yeni Kayıt
                const newUser = {
                    username: username,
                    password: password,
                    discordId: discordId,
                    role: 'ÜYE',
                    race: 'İnsan',
                    level: 1,
                    id: 'user_' + Date.now()
                };
                users.push(newUser);
                localStorage.setItem('asthenya_users', JSON.stringify(users));
                localStorage.setItem('asthenya_logged_in_user', JSON.stringify(newUser));
                alert(`Yeni bir efsane doğuyor: ${username}! Kaydın yapıldı.`);
                checkAdminAccess();
                syncUserIdentities();
            }
        });
    }

    initializeDefaultAdmin();

    // --- Yetki Kontrolü (Admin Access) ---
    function checkAdminAccess() {
        const adminBtn = document.getElementById('admin-nav-btn');
        if (!adminBtn) return;

        const sessionStr = localStorage.getItem('asthenya_session');
        if (!sessionStr) {
            adminBtn.style.display = 'none';
            return;
        }
        try {
            const session = JSON.parse(sessionStr);
            const authorizedRoles = ['KURUCU', 'DEVELOPER', 'ADMİN', 'ADMIN'];
            if (authorizedRoles.includes(session.role)) {
                adminBtn.style.display = 'flex';
            } else {
                adminBtn.style.display = 'none';
            }
        } catch (e) {
            adminBtn.style.display = 'none';
        }
    }

    // --- Kimlik Senkronizasyonu (Identity Sync) ---
    function syncUserIdentities() {
        const savedUsers = JSON.parse(localStorage.getItem('asthenya_users') || '[]');
        if (savedUsers.length === 0) return;

        // Kurucuyu veya ilk kullanıcıyı bul (Admin olarak kabul ediyoruz)
        const adminUser = savedUsers.find(u => u.role === 'KURUCU' || u.role === 'ADMIN') || savedUsers[0];

        if (adminUser) {
            // 4. Profil Sayfasındaki İsmi Güncelle
            const profileName = document.querySelector('#profil .info-item:first-child .info-value');
            if (profileName) {
                profileName.textContent = adminUser.username;
            }
        }
    }

    // --- Mesajlaşma Sistemi (Messenger Logic) ---
    const chatsData = {
        'admin': {
            name: 'Asthenya Destek',
            status: 'Çevrimiçi (7/24 Destek Botu)',
            avatar: 'img/tanrımühür.png',
            messages: [
                { type: 'incoming', text: 'Merhaba maceracı! Ben Asthenya Destek Botu. Diyar ile ilgili bir sorunun veya şikayetin varsa bana yazabilirsin. Mesajın doğrudan yetkililere iletilecektir.', time: '14:15' }
            ]
        },
        'leo': {
            name: 'Maceracı Leo',
            status: 'Çevrimiçi (Zindanda)',
            avatar: 'img/tanrımühür.png',
            messages: [
                { type: 'incoming', text: 'Asthenya\'nın kaderi senin ellerinde, genç maceracı. Gölgeler yaklaşıyor.', time: '12:40' },
                { type: 'outgoing', text: 'Hazırım Leo. Mühürlerin gücü benimle.', time: '12:42' },
                { type: 'incoming', text: 'Zindan seferine geliyor musun? Ekip toplanıyor.', time: '12:45' }
            ]
        },
        'elya': {
            name: 'Gezgin Elya',
            status: 'Çevrimdışı (Dinleniyor)',
            avatar: 'img/tanrımühür.png',
            messages: [
                { type: 'incoming', text: 'Selam! Pazarda harika bir parşömen gördüm, tam senin tarzın.', time: 'Dün' },
                { type: 'outgoing', text: 'Hangi pazarda? Hemen bakmalıyım.', time: 'Dün' }
            ]
        },
        'brutus': {
            name: 'Savaşçı Brutus',
            status: 'Çevrimiçi (Demirci Atölyesi)',
            avatar: 'img/tanrımühür.png',
            messages: [
                { type: 'incoming', text: 'Kalkanımı tamir etmem lazım. Son ejderha nefesi biraz fazla sıcaktı!', time: '09:15' }
            ]
        }
    };

    const chatItems = document.querySelectorAll('.chat-item');
    const chatWindow = document.querySelector('.chat-window');
    const messagesArea = document.getElementById('chat-messages-area');

    if (chatItems.length > 0 && messagesArea) {
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                const data = chatsData[chatId];

                if (!data) return;

                chatItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                chatWindow.querySelector('.active-name').textContent = data.name;
                chatWindow.querySelector('.active-status').textContent = data.status;
                chatWindow.querySelector('.active-chat-avatar').src = data.avatar;

                if (data.isAdmin) {
                    chatWindow.querySelector('.active-chat-avatar').classList.add('admin-border');
                    chatWindow.querySelector('.active-status').style.color = '#ff4444';
                } else {
                    chatWindow.querySelector('.active-chat-avatar').classList.remove('admin-border');
                    chatWindow.querySelector('.active-status').style.color = '#10b981';
                }

                // Minimum Admin Rütbesi Uyarısı (Eğer admin ise)
                const rankWarn = document.getElementById('admin-rank-warning');
                if (data.isAdmin) {
                    if (!rankWarn) {
                        const warnDiv = document.createElement('div');
                        warnDiv.id = 'admin-rank-warning';
                        warnDiv.style.cssText = 'background: rgba(255,68,68,0.1); color: #ff4444; font-size: 0.65rem; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,68,68,0.2); margin-top: 5px; font-family: Cinzel, serif; letter-spacing: 1px;';
                        warnDiv.innerHTML = '<i class="fa-solid fa-shield-halved"></i> MİNİMUM YÖNETİCİ YETKİSİ: <span style="font-weight:bold;">MODERATÖR</span>';
                        chatWindow.querySelector('.active-text-info').appendChild(warnDiv);
                    }
                } else if (rankWarn) {
                    rankWarn.remove();
                }

                // Mesajları Render Et
                renderMessages(chatId);

                // Seçenekler Menüsünü ve Giriş Alanını Güncelle
                updateOptionsMenu();
                checkBlockState(chatId);

                // Bildirimleri Sıfırla (Bu oda için)
                clearChatUnread(chatId);
            });
        });
    }

    window.closeMessenger = () => {
        // Mesajlar sayfasını gizle, gerçek ana sayfayı (Hero Section) göster
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        document.getElementById('anasayfa').classList.add('active');

        // Navigasyon menüsündeki aktif sınıfını güncelle
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('a[href="#anasayfa"]').classList.add('active');
    };

    // --- Bildirim Rozetleri Mantığı ---
    function updateNotificationBadges() {
        const unreadCounts = JSON.parse(localStorage.getItem('asthenya_unread_counts') || '{}');
        const globalBadge = document.getElementById('global-msg-badge');
        let totalUnread = 0;

        // Bireysel rozetleri güncelle
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            const chatId = item.getAttribute('data-chat-id');
            const count = unreadCounts[chatId] || 0;
            totalUnread += count;

            let badge = item.querySelector('.chat-badge');
            if (count > 0) {
                if (!badge) {
                    const infoTop = item.querySelector('.chat-top');
                    badge = document.createElement('span');
                    badge.className = 'chat-badge';
                    infoTop.appendChild(badge);
                }
                badge.innerText = count > 9 ? '+9' : `+${count}`;
                badge.style.display = 'inline-block';
            } else if (badge) {
                badge.style.display = 'none';
            }
        });

        // Global rozeti güncelle
        if (globalBadge) {
            if (totalUnread > 0) {
                globalBadge.innerText = totalUnread > 9 ? '+9' : totalUnread;
                globalBadge.style.display = 'flex';
            } else {
                globalBadge.style.display = 'none';
            }
        }
    }

    function clearChatUnread(chatId) {
        const unreadCounts = JSON.parse(localStorage.getItem('asthenya_unread_counts') || '{}');
        unreadCounts[chatId] = 0;
        localStorage.setItem('asthenya_unread_counts', JSON.stringify(unreadCounts));
        updateNotificationBadges();
    }

    // --- Mesaj Gönderme Mantığı ---
    function sendMessage() {
        const activeItem = document.querySelector('.chat-item.active');
        const input = document.querySelector('.chat-input-area input');
        if (!activeItem || !input || !input.value.trim()) return;

        const chatId = activeItem.getAttribute('data-chat-id');
        const text = input.value.trim();
        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const sessionStr = localStorage.getItem('asthenya_session');
        let senderName = 'Bilinmeyen';
        let senderRole = 'ÜYE';
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                senderName = session.username;
                senderRole = session.role || 'ÜYE';
            } catch (e) { }
        }

        const newMessage = {
            type: 'outgoing',
            text: text,
            time: time,
            sender: senderName,
            senderRole: senderRole
        };

        // 1. Bellekteki veriyi güncelle
        if (chatsData[chatId]) {
            chatsData[chatId].messages.push(newMessage);

            // 2. LocalStorage'a kaydet (Persistence)
            const savedHistory = JSON.parse(localStorage.getItem('asthenya_chat_history') || '{}');
            if (!savedHistory[chatId]) savedHistory[chatId] = [];
            savedHistory[chatId].push(newMessage);
            localStorage.setItem('asthenya_chat_history', JSON.stringify(savedHistory));

            // 3. Arayüzü tazele
            renderMessages(chatId);
            input.value = '';
        }
    }

    const sendBtn = document.querySelector('.chat-send-btn');
    const chatInput = document.querySelector('.chat-input-area input');

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function renderMessages(chatId) {
        const data = chatsData[chatId];
        messagesArea.innerHTML = '';

        const sessionStr = localStorage.getItem('asthenya_session');
        let currentUser = '';
        if (sessionStr) {
            try {
                currentUser = JSON.parse(sessionStr).username;
            } catch (e) { }
        }

        // Eğer admin ile sohbet ediliyorsa, sistem mesajlarını ve bu kullanıcıya ait mesajları filtrele
        let displayMessages = data.messages;
        if (chatId === 'admin') {
            displayMessages = data.messages.filter(msg =>
                !msg.receiver ||
                msg.sender === currentUser ||
                msg.receiver === currentUser ||
                (msg.receiver && msg.receiver.toLowerCase().includes(currentUser.toLowerCase())) ||
                (currentUser && currentUser.toLowerCase().includes(msg.receiver.toLowerCase())) ||
                currentUser === 'Admin' || currentUser === 'Metin' || currentUser === 'Sistem'
            );
        }

        if (displayMessages.length === 0) {
            messagesArea.innerHTML = '<div style="text-align:center; padding:2rem; opacity:0.3; font-size:0.8rem; font-family:Cinzel, serif;">Kuzgun mesajları arşivi temiz.</div>';
            return;
        }

        displayMessages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.type}`;
            msgDiv.innerHTML = `
                <div class="message-bubble">${msg.text}</div>
                <span class="message-time">${msg.time}</span>
            `;
            messagesArea.appendChild(msgDiv);
        });
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function checkBlockState(chatId) {
        const blockedUsers = JSON.parse(localStorage.getItem('asthenya_blocked_users') || '[]');
        const inputArea = document.querySelector('.chat-input-area');
        const input = inputArea.querySelector('input');
        const sendBtn = inputArea.querySelector('button');

        if (blockedUsers.includes(chatId)) {
            input.disabled = true;
            input.placeholder = "BU KULLANICIYI ENGELLEDİNİZ";
            input.style.opacity = "0.5";
            sendBtn.style.pointerEvents = "none";
            sendBtn.style.opacity = "0.3";
        } else {
            input.disabled = false;
            input.placeholder = "Fermanını buraya yaz...";
            input.style.opacity = "1";
            sendBtn.style.pointerEvents = "auto";
            sendBtn.style.opacity = "1";
        }
    }

    // --- Kalıcı Veri Yükleme (Mesaj ve Engel Geçmişi) ---
    function loadChatPersistence() {
        const savedHistory = localStorage.getItem('asthenya_chat_history');
        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            Object.keys(history).forEach(chatId => {
                if (chatsData[chatId]) {
                    const initial = chatsData[chatId].messages.filter(m => m.time === '14:15' || m.time === '12:40' || m.time === 'Dün' || m.time === '09:15');
                    chatsData[chatId].messages = [...initial, ...history[chatId]];
                }
            });
        }
    }

    window.deleteMessages = () => {
        const activeItem = document.querySelector('.chat-item.active');
        if (!activeItem) return;

        const chatId = activeItem.getAttribute('data-chat-id');
        if (confirm('Tüm mesaj geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            // Bellekte sil
            chatsData[chatId].messages = [];

            // LocalStorage'a kaydet
            const savedHistory = JSON.parse(localStorage.getItem('asthenya_chat_history') || '{}');
            savedHistory[chatId] = [];
            localStorage.setItem('asthenya_chat_history', JSON.stringify(savedHistory));

            // Arayüzü güncelle (Render fonksiyonunu kullan)
            renderMessages(chatId);
            alert('Mesaj geçmişi kalıcı olarak silindi.');
        }
    };

    window.toggleBlockUser = () => {
        const activeItem = document.querySelector('.chat-item.active');
        if (!activeItem) return;

        const chatId = activeItem.getAttribute('data-chat-id');
        let blockedUsers = JSON.parse(localStorage.getItem('asthenya_blocked_users') || '[]');

        if (blockedUsers.includes(chatId)) {
            blockedUsers = blockedUsers.filter(id => id !== chatId);
            alert('Kişinin engeli kaldırıldı.');
        } else {
            blockedUsers.push(chatId);
            alert('Kişi engellendi. Artık size mesaj gönderemez.');
        }

        localStorage.setItem('asthenya_blocked_users', JSON.stringify(blockedUsers));
        updateOptionsMenu();
        checkBlockState(chatId);
    };

    function updateOptionsMenu() {
        const activeItem = document.querySelector('.chat-item.active');
        if (!activeItem) return;

        const chatId = activeItem.getAttribute('data-chat-id');
        const blockedUsers = JSON.parse(localStorage.getItem('asthenya_blocked_users') || '[]');
        const blockBtn = document.querySelector('.menu-item[onclick="toggleBlockUser()"]');

        if (blockBtn) {
            if (blockedUsers.includes(chatId)) {
                blockBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> Kişinin Engelini Kaldır';
                blockBtn.style.color = '#10b981';
            } else {
                blockBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Kişiyi Engelle';
                blockBtn.style.color = '';
            }
        }
    }

    // Chat sekmesi tıklandığında menüyü de güncelle
    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            // ... (mevcut tık mantığı zaten var, sonuna ekleyelim)
            setTimeout(updateOptionsMenu, 10);
        });
    });

    loadChatPersistence();
    updateNotificationBadges();
    checkAdminAccess();

    // --- Gerçek Zamanlı Senkronizasyon (F5 Gerektirmez) ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'asthenya_logged_in_user') {
            checkAdminAccess();
        }
        if (e.key === 'asthenya_announcements') {
            initPublicAnnouncements();
        }
        if (e.key === 'asthenya_users') {
            syncUserIdentities();
        }
        if (e.key === 'asthenya_custom_guilds') {
            if (typeof loadCustomGuilds === 'function') loadCustomGuilds();
        }
        if (e.key === 'asthenya_chat_history') {
            loadChatPersistence();
            const currentActive = document.querySelector('.chat-item.active');
            const activeId = currentActive ? currentActive.getAttribute('data-chat-id') : null;

            if (activeId) {
                renderMessages(activeId);
                clearChatUnread(activeId); // Aktif odayı temizle
            }
            updateNotificationBadges(); // Tüm rozetleri tazele
        }
        if (e.key === 'asthenya_unread_counts') {
            updateNotificationBadges();
        }
        if (e.key === 'asthenya_blocked_users') {
            const currentActive = document.querySelector('.chat-item.active');
            if (currentActive) {
                updateOptionsMenu();
                checkBlockState(currentActive.getAttribute('data-chat-id'));
            }
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            initPublicAnnouncements();
            syncUserIdentities();
            loadChatPersistence();
            if (typeof loadCustomGuilds === 'function') loadCustomGuilds();
        }
    });

    // --- Admin Paneli Sekme Sistemi ---
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminTabPanes = document.querySelectorAll('.admin-tab-pane');

    if (adminTabBtns.length > 0) {
        adminTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Buton aktifliğini güncelle
                adminTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // İçerik panelini güncelle
                adminTabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === `tab-${targetTab}`) {
                        pane.classList.add('active');
                    }
                });
            });
        });
    }

    // Navigasyon sistemine admin butonunu dahil et
    const adminNavBtn = document.getElementById('admin-nav-btn');
    if (adminNavBtn) {
        adminNavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const sessionStr = localStorage.getItem('asthenya_session');
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    const authorizedRoles = ['KURUCU', 'DEVELOPER', 'ADMİN', 'ADMIN'];
                    if (authorizedRoles.includes(session.role)) {
                        // sessionStorage'a yetkili bilgisini aktar (admin.html'deki logActivity ve diğer işlemler için)
                        sessionStorage.setItem('asthenya_admin_authorized', 'true');
                        sessionStorage.setItem('asthenya_admin_data', JSON.stringify(session));
                        window.location.href = 'admin.html';
                        return;
                    }
                } catch (err) { }
            }
            alert('Bu alana girmeye yetkiniz bulunmamaktadır!');
        });
    }

    // --- Dinamik Duyuru Sistemi (Public Announcements) ---
    function initPublicAnnouncements() {
        const announcementsContainer = document.getElementById('announcement-list');
        const emptyBox = document.getElementById('no-ann-box');
        const announcementNavBtn = document.querySelector('a[href="#duyurular"]');

        if (!announcementsContainer) return;

        const announcements = JSON.parse(localStorage.getItem('asthenya_announcements') || '[]');

        if (announcements.length === 0) {
            if (emptyBox) emptyBox.style.display = 'block';
            announcementsContainer.style.display = 'none';
        } else {
            if (emptyBox) emptyBox.style.display = 'none';
            announcementsContainer.style.display = 'grid';
            announcementsContainer.innerHTML = '';

            announcements.forEach(ann => {
                const typeInfo = getAnnouncementTypeInfo(ann.type);
                const annCard = document.createElement('div');
                annCard.className = 'event-card';
                annCard.innerHTML = `
                    <div class="event-image" style="background: linear-gradient(45deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                        ${typeInfo.icon}
                    </div>
                    <div class="event-content">
                        <span class="event-date">${ann.date}</span>
                        <h3 class="event-title">${ann.title}</h3>
                        <p class="event-desc">${ann.content}</p>
                        <div class="event-footer">
                            <span class="event-tag" style="background: ${typeInfo.color}33; color: ${typeInfo.color}">${typeInfo.label}</span>
                            <button class="event-btn" onclick="openFerman(${ann.id})">FERMANI OKU</button>
                        </div>
                    </div>
                `;
                announcementsContainer.appendChild(annCard);
            });
        }

    }

    window.openFerman = (id) => {
        const announcements = JSON.parse(localStorage.getItem('asthenya_announcements') || '[]');
        const ann = announcements.find(a => a.id == id);
        if (!ann) return;

        const reader = document.getElementById('ferman-reader-overlay');
        const typeInfo = getAnnouncementTypeInfo(ann.type);

        document.getElementById('reader-tag').innerText = typeInfo.label;
        document.getElementById('reader-tag').style.background = `${typeInfo.color}33`;
        document.getElementById('reader-tag').style.color = typeInfo.color;
        document.getElementById('reader-date').innerText = ann.date;
        document.getElementById('reader-title').innerText = ann.title;
        document.getElementById('reader-content').innerText = ann.content;

        reader.style.display = 'flex';
    };

    window.closeFerman = () => {
        document.getElementById('ferman-reader-overlay').style.display = 'none';
    };

    function getAnnouncementTypeInfo(type) {
        switch (type) {
            case 'etkinlik': return { icon: '✨', label: 'ETKİNLİK', color: '#dfb754' };
            case 'savas': return { icon: '⚔️', label: 'SAVAŞ', color: '#ff4444' };
            case 'guncelleme': return { icon: '🛠️', label: 'GÜNCELLEME', color: '#3b82f6' };
            case 'onemli': return { icon: '🔥', label: 'ÖNEMLİ', color: '#f59e0b' };
            default: return { icon: '📜', label: 'FERMAN', color: '#888' };
        }
    }

    // --- Chat Seçenekleri ve Şikayet Sistemi ---
    const optionsBtn = document.getElementById('chat-options-btn');
    const optionsMenu = document.getElementById('chat-options-menu');
    const reportModal = document.getElementById('report-modal-overlay');

    if (optionsBtn && optionsMenu) {
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            optionsMenu.classList.remove('active');
        });
    }

    // İlk yüklemede ve sekme geçişlerinde çalıştır
    initPublicAnnouncements();
    syncUserIdentities();

    window.openReportModal = () => {
        const reportModal = document.getElementById('report-modal-overlay');
        const optionsMenu = document.getElementById('chat-options-menu');
        if (reportModal) reportModal.style.display = 'flex';
        if (optionsMenu) optionsMenu.classList.remove('active');
    };

    window.closeReportModal = () => {
        const reportModal = document.getElementById('report-modal-overlay');
        if (reportModal) reportModal.style.display = 'none';
        const reasonInput = document.getElementById('report-reason');
        if (reasonInput) reasonInput.value = '';
    };

    window.submitReport = () => {
        const reasonInput = document.getElementById('report-reason');
        const reason = reasonInput ? reasonInput.value : '';
        const activeName = document.querySelector('.active-name').textContent;

        // Raporlayan ismini doğrudan ekrandaki profil isminden çek (EN GARANTİ YOL)
        const profileNameEl = document.getElementById('profile-hero-name');
        let reporter = profileNameEl ? profileNameEl.innerText.trim() : null;

        // Eğer DOM'da bulunamazsa session'a bak
        if (!reporter || reporter === "Efsanevi Gezgin" || reporter === "") {
            const sessionStr = localStorage.getItem('asthenya_session');
            if (sessionStr) {
                try {
                    reporter = JSON.parse(sessionStr).username;
                } catch (e) { }
            }
        }

        // Hala bulunamazsa varsayılan ata
        if (!reporter) reporter = "Bilinmeyen Maceracı";

        if (!reason.trim()) {
            alert('Lütfen bir sebep belirtin.');
            return;
        }

        const report = {
            id: Date.now(),
            reporter: reporter,
            targetUser: activeName,
            reason: reason,
            date: new Date().toLocaleString('tr-TR'),
            status: 'Beklemede'
        };

        const existingReports = JSON.parse(localStorage.getItem('asthenya_reports') || '[]');
        existingReports.unshift(report);
        localStorage.setItem('asthenya_reports', JSON.stringify(existingReports));

        alert('Şikayetiniz kozmik yöneticilere iletildi. Şu an ilgileniyorlar!');
        closeReportModal();
    };

    // Aktif sohbet durumunu yükle
    loadChatPersistence();
    const initialActive = document.querySelector('.chat-item.active');
    if (initialActive) {
        const initialId = initialActive.getAttribute('data-chat-id');
        updateOptionsMenu();
        checkBlockState(initialId);
        renderMessages(initialId);
    }

    // --- OTURUM VE GİRİŞ KONTROLÜ (Giriş Kapısı Mantığı) ---
    window.checkSession = function () {
        const session = localStorage.getItem('asthenya_session');
        const gate = document.getElementById('login-gate');
        if (!gate) return;

        if (!session) {
            gate.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            gate.style.display = 'none';
            document.body.style.overflow = 'auto';
            window.currentUser = JSON.parse(session).username;
            updateUIPerUser();
        }
    };

    window.loginToAsthenya = function () {
        const userVal = document.getElementById('login-user').value.trim();
        const passVal = document.getElementById('login-pass').value.trim();
        const error = document.getElementById('login-error');

        if (!userVal || !passVal) return;

        const users = JSON.parse(localStorage.getItem('asthenya_users') || '[]');
        const found = users.find(u => u.username.toLowerCase() === userVal.toLowerCase() && u.password === passVal);

        if (found) {
            localStorage.setItem('asthenya_session', JSON.stringify({
                username: found.username,
                role: found.role,
                loginTime: new Date().getTime()
            }));

            // Başarı efekti (Kapı açılmadan önce modalın küçülüp kaybolması)
            const modal = document.querySelector('#login-gate > div');
            if (modal) {
                modal.style.transition = 'all 0.4s ease';
                modal.style.transform = 'scale(0.8)';
                modal.style.opacity = '0';
            }

            setTimeout(() => {
                checkSession();
                // showNotification varsa kullan yoksa alert
                if (window.showNotification) {
                    showNotification(`${found.username} diyara tekrar hoş geldin!`);
                }
            }, 500);
        } else {
            if (error) {
                error.style.display = 'block';
                setTimeout(() => { error.style.display = 'none'; }, 3000);
            }
        }
    };

    window.logoutFromAsthenya = function () {
        // Çıkış yapılınca offline işaretle
        const sessionStr = localStorage.getItem('asthenya_session');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                setUserOnlineStatus(session.username, 'offline');
            } catch (e) { }
        }
        localStorage.removeItem('asthenya_session');
        window.location.reload();
    };

    function updateUIPerUser() {
        const sessionStr = localStorage.getItem('asthenya_session');
        if (!sessionStr) return;
        const session = JSON.parse(sessionStr);
        const adminBtn = document.getElementById('admin-nav-btn');

        // Sadece yetkili rollere yönetim panelini göster
        const authorizedRoles = ['KURUCU', 'DEVELOPER', 'ADMİN', 'ADMIN'];
        if (adminBtn) {
            if (authorizedRoles.includes(session.role)) {
                adminBtn.style.display = 'flex';
            } else {
                adminBtn.style.display = 'none';
            }
        }

        // Profil isim alanlarını güncelle
        const profileHeroName = document.getElementById('profile-hero-name');
        const profileInfoName = document.getElementById('profile-info-name');

        if (profileHeroName) {
            profileHeroName.textContent = session.username;
        }
        if (profileInfoName) {
            profileInfoName.textContent = session.username;
        }

        // Diyardaki Hükmü (Rol) Güncellemesi
        const profileRoleDisplay = document.getElementById('profile-role-display');
        if (profileRoleDisplay && session.role) {
            profileRoleDisplay.textContent = session.role;

            // Role göre özel renk/efekt eklenebilir
            if (session.role === 'KURUCU') {
                profileRoleDisplay.style.color = '#ff4444';
                profileRoleDisplay.style.textShadow = '0 0 20px rgba(255, 68, 68, 0.8)';
            } else if (session.role === 'DEVELOPER') {
                profileRoleDisplay.style.color = '#00e5ff';
                profileRoleDisplay.style.textShadow = '0 0 20px rgba(0, 229, 255, 0.8)';
            }
        }

        // Hazine alanı arayüzden kaldırıldığı için DOM güncellemesi iptal edildi.
    }

    // --- Çevrimcişi Takip Sistemi (Heartbeat) ---
    function setUserOnlineStatus(username, status) {
        const users = JSON.parse(localStorage.getItem('asthenya_users') || '[]');
        const idx = users.findIndex(u => u.username === username);
        if (idx !== -1) {
            users[idx].status = status;
            users[idx].lastSeen = new Date().getTime();
            localStorage.setItem('asthenya_users', JSON.stringify(users));
        }
    }

    // Heartbeat: Her 30 saniyede bir "lastSeen" güncelle
    function startHeartbeat() {
        const sessionStr = localStorage.getItem('asthenya_session');
        if (!sessionStr) return;
        try {
            const session = JSON.parse(sessionStr);
            setUserOnlineStatus(session.username, 'online');
        } catch (e) { }
    }

    // Sekme/tarayıcı kapatılınca offline yap
    window.addEventListener('beforeunload', () => {
        const sessionStr = localStorage.getItem('asthenya_session');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                setUserOnlineStatus(session.username, 'offline');
            } catch (e) { }
        }
    });

    // Sayfa görünürlüğü değişince (sekme geçişi)
    document.addEventListener('visibilitychange', () => {
        const sessionStr = localStorage.getItem('asthenya_session');
        if (!sessionStr) return;
        try {
            const session = JSON.parse(sessionStr);
            if (document.hidden) {
                setUserOnlineStatus(session.username, 'offline');
            } else {
                setUserOnlineStatus(session.username, 'online');
            }
        } catch (e) { }
    });

    // Uygulamayı Başlat
    attemptAutoplay();
    if (typeof loadCustomGuilds === 'function') loadCustomGuilds();

    // Sinematik açılış bittikten sonra (3.5s + 1.5s = 5s) oturum kontrolü yap
    setTimeout(() => {
        checkSession();
        // Eğer zaten giriş yapılmışsa heartbeat başlat
        const sessionStr = localStorage.getItem('asthenya_session');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                setUserOnlineStatus(session.username, 'online');
                setInterval(startHeartbeat, 30000); // 30 saniyede bir
            } catch (e) { }
        }
    }, 5000);
});
