// ============================================
// THREE.JS SCENE SETUP - Postavka 3D scene
// ============================================

// Kreiranje 3D scene - prostor gde se nalaze svi 3D objekti
const scene = new THREE.Scene();

// Kreiranje kamere - "oko" kroz koje gledamo scenu
// PerspectiveCamera(FOV, aspect ratio, near clipping, far clipping)
const camera = new THREE.PerspectiveCamera(
    45,    // FOV (Field of View) - ugao gledanja u stepenima (širi ugao = više se vidi)
    window.innerWidth / window.innerHeight,  // Aspect ratio - odnos širine i visine
    0.1,   // Near clipping - najbliža vidljiva tačka
    1000   // Far clipping - najdalja vidljiva tačka
);

// Kreiranje renderera - "crta" 3D scenu na ekran
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,  // Antialias - glatke ivice objekata (bolja kvaliteta)
    alpha: true       // Transparentna pozadina - omogućava da se vidi HTML ispod
});
renderer.setSize(window.innerWidth, window.innerHeight);  // Postavi veličinu renderera na ceo ekran
renderer.setPixelRatio(window.devicePixelRatio);  // Pixel ratio - oštra slika na retina ekranima
document.getElementById('canvas-container').appendChild(renderer.domElement);  // Dodaj canvas u HTML

// ============================================
// LIGHTING SETUP - Postavljanje svetla u sceni
// ============================================

// Uklonjena su stara svetla.

// Svetlo iza objekta (Backlight) - stvara "rim" efekat kao na slici
const backlight = new THREE.PointLight(0xffffff, 2, 15); // Boja, Intenzitet, Domet
backlight.position.set(0, 0.5, -2); // Pozicija iza modela
scene.add(backlight);

// Blago svetlo sa prednje strane da objekat ne bude skroz crn
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(0, 0, 5); // Dolazi iz pravca kamere
scene.add(fillLight);

// Ambient light za opšte, suptilno osvetljenje
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Dodavanje "Fog" efekta da bi se pozadina postepeno zatamnila
scene.fog = new THREE.Fog(0x000000, 5, 12); // Boja, Blizina, Daljina

// ============================================
// MODEL LOADING - Učitavanje 3D modela
// ============================================

// Promenljive za 3D modele
let model;   // Model 1 - Wax seal (pečat) - koristi se u sekcijama 1 i 2
let model3;  // Model 2 - Flaša (FinalBaseMesh - Copy.obj) - koristi se u sekcijama 3 i 4
let bottleModels = []; // Niz flaša za sekciju 6 (više boja)
let currentBottleIndex = 0; // Trenutno prikazana flaša
let bottleSlots = []; // Slotovi na stage-u koji predstavljaju flaše
let bottleActionsContainer = null; // Kontejner za akcione dugmiće (npr. Gold varijanta)
let bottleVariantButton = null; // Dugme za Gold varijantu treće flaše
const GOLD_BOTTLE_INDEX = 2; // Indeks flaše koja ima Gold varijantu (0-based)
let goldVariantActive = false; // Da li je uključena Gold varijanta za ciljanu flašu

// OBJ Loader - alat za učitavanje .obj fajlova
const loader = new THREE.OBJLoader();

// Učitavanje prvog modela (Wax Seal - pečat)
loader.load(
    'assets/FinalBaseMesh.obj',  // Putanja do .obj fajla
    function (obj) {  // SUCCESS callback - poziva se kada se model uspešno učita
        model = obj;  // Sačuvaj učitani model
        
        // Material - Phong materijal (realistično svetlo i senke)
        const material = new THREE.MeshPhongMaterial({
            color: 0x8b1a1a,      // Boja modela - tamno crvena (#8b1a1a)
            shininess: 30,        // Sjaj površine (veći broj = sjajnija površina)
            specular: 0x444444    // Boja odsjaja (svetli delovi kada svetlo pogodi model)
        });
        
        // Primeni materijal na sve delove modela
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {  // Proveri da li je deo modela mesh
                child.material = material;  // Postavi materijal
            }
        });
        
        // POČETNA POZICIJA MODELA 1 - Sekcija 1 (Hero)
        model.position.set(0, 0, 1);  // X: centar (0), Y: centar (0), Z: dubina (1)
        model.rotation.x = 0;  // Rotacija po X osi - 0° (bez rotacije)
        model.rotation.y = 0;  // Rotacija po Y osi - 0° (bez rotacije)
        model.scale.set(0.007, 0.007, 0.007);  // Veličina modela - VELIKA veličina za sekciju 1
        
        scene.add(model);  // Dodaj model u scenu
        
        // Učitaj drugi model (flaša)
        loadModel3();
        
        // Učitaj flaše za sekciju 6
        loadBottleModels();
        
        // Pokreni scroll logiku (dugmad i wheel event)
        setupScrollSnap();
    },
    function (xhr) {  // PROGRESS callback - prati napredak učitavanja
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {  // ERROR callback - poziva se ako učitavanje ne uspe
        console.error('Error loading model:', error);
    }
);

// ============================================
// LOAD MODEL 3 - Učitavanje drugog modela (flaša)
// ============================================
function loadModel3() {
    const loader3 = new THREE.OBJLoader();  // Novi loader za drugi model
    
    loader3.load(
        'assets/FinalBaseMesh - Copy.obj',  // Putanja do .obj fajla flaše
        function (obj) {  // SUCCESS callback
            model3 = obj;  // Sačuvaj model u promenljivu model3
            
            // Material za model 3 - isti kao za model 1 (crveni wax seal)
            const material = new THREE.MeshPhongMaterial({
                color: 0x444444,      // Tamno crvena boja
                shininess: 30,        // Sjaj površine
                specular: 0x444444    // Boja odsjaja
            });
            
            // Primeni materijal na sve delove modela
            model3.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = material;
                }
            });
            
            // Početna pozicija objekta 2 - desna strana sekcije 3, nevidljiv na početku
            model3.position.set(2, 0, 1);  // X: desna polovina, Y: centar, Z: dubina 1
            model3.rotation.x = -Math.PI / 2; // Rotacija -90° po X osi da bude uspravna (flaša stoji)
            model3.rotation.y = 0; // Bez rotacije po Y osi
            model3.scale.set(0.05, 0.05, 0.05); // Početna veličina - UVEĆANO 2x (bilo 0.01)
            model3.visible = false; // Sakriven dok ne dođemo do sekcije 3
            
            scene.add(model3);  // Dodaj model u scenu
            console.log('Model 3 loaded successfully');  // Log u konzolu
        },
        function (xhr) {  // PROGRESS callback
            console.log('Model 3: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {  // ERROR callback
            console.error('Error loading model 3:', error);
        }
    );
}

// ============================================
// LOAD BOTTLE MODELS - Učitavanje 6 flaša za sekciju 6
// ============================================
function loadBottleModels() {
    const loader = new THREE.OBJLoader();
    const textureLoader = new THREE.TextureLoader();

    bottleModels = new Array(bottleData.length);
    let loadedCount = 0;

    const finalizeSetup = () => {
        if (loadedCount !== bottleData.length) {
            return;
        }

        const readyCount = bottleModels.filter(Boolean).length;
        console.log('Bottle models loaded:', readyCount);

        arrangeBottleModels(currentBottleIndex, true);
        updateStageLayout(currentBottleIndex);
        updateBottleUI(currentBottleIndex);

        if (currentSection !== 6) {
            hideStageBottles();
        }
    };

    const registerBottle = (index, mesh) => {
        if (!mesh) {
            console.warn(`Bottle at index ${index} could not be initialized.`);
            loadedCount++;
            finalizeSetup();
            return;
        }

        if (!mesh.userData) {
            mesh.userData = {};
        }

        mesh.visible = false;
        mesh.renderOrder = 0;
        mesh.position.set(0, -1, 1);
        mesh.scale.set(0.04, 0.04, 0.04);

        bottleModels[index] = mesh;
        scene.add(mesh);

        loadedCount++;
        finalizeSetup();
    };

    const createImageBottle = (index, data) => {
        textureLoader.load(
            data.image,
            (texture) => {
                const width = data.imageWidth || 1;
                const height = data.imageHeight || 2.6;
                const geometry = new THREE.PlaneGeometry(width, height);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    alphaTest: 0.05,
                    opacity: 0
                });

                const plane = new THREE.Mesh(geometry, material);
                plane.userData.stageMaterials = [material];
                plane.userData.originalColor = null;
                plane.userData.currentColor = null;
                plane.userData.isImage = true;
                plane.userData.scaleMultiplier = data.imageScale || 1.4;
                plane.userData.positionOffset = data.imageOffset || { x: 0, y: 0, z: 0 };
                plane.userData.rotationOverride = data.imageRotation || { x: 0, y: 0, z: 0 };

                registerBottle(index, plane);
            },
            undefined,
            (error) => {
                console.error('Error loading bottle image:', error);
                loadedCount++;
                finalizeSetup();
            }
        );
    };

    loader.load(
        'assets/FinalBaseMesh - Copy.obj',
        function (obj) {
            bottleData.forEach((data, index) => {
                if (data.isImage && data.image) {
                    createImageBottle(index, data);
                    return;
                }

                const bottleClone = obj.clone();
                const material = new THREE.MeshPhongMaterial({
                    color: data.color,
                    shininess: 50,
                    specular: 0x666666,
                    transparent: true,
                    opacity: 0
                });
                const stageMaterials = [material];

                bottleClone.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = material;
                    }
                });

                bottleClone.rotation.x = -Math.PI / 2;
                bottleClone.rotation.y = 0;
                bottleClone.userData.stageMaterials = stageMaterials;
                bottleClone.userData.originalColor = data.color;
                bottleClone.userData.currentColor = data.color;
                bottleClone.userData.isImage = false;
                bottleClone.userData.scaleMultiplier = 1;
                bottleClone.userData.positionOffset = { x: 0, y: 0, z: 0 };
                bottleClone.userData.rotationOverride = null;

                registerBottle(index, bottleClone);
            });

            finalizeSetup();
        },
        undefined,
        function (error) {
            console.error('Error loading bottle models:', error);
        }
    );
}

// Postavi kameru na distancu - Z pozicija 5 (daleko od objekata)
camera.position.z = 5;

// ============================================
// GLOBAL VARIABLES - Globalne promenljive za kontrolu scroll-a
// ============================================
let currentSection = 1;      // Trenutna sekcija u kojoj se nalazimo (1, 2, 3, 4, ili 5)
let isAnimating = false;     // Da li je animacija u toku (sprečava preklapanje animacija)
let scrollAttempts = 0;      // Broj pokušaja scroll-a (za threshold)
let lastScrollTime = 0;      // Vreme poslednjeg scroll-a (za timeout)

// ============================================
// TAB SYSTEM DATA - Podaci za svaki tab (slika)
// ============================================
const tabData = {
    1: { title: 'PRODUCT 1', description: 'Premium quality honey with natural sweetness and rich flavor profile.' },
    2: { title: 'PRODUCT 2', description: 'Organic honey harvested from wildflowers in pristine meadows.' },
    3: { title: 'PRODUCT 3', description: 'Mountain honey with unique floral notes and smooth texture.' },
    4: { title: 'PRODUCT 4', description: 'Forest honey with deep amber color and robust taste.' },
    5: { title: 'PRODUCT 5', description: 'Acacia honey known for its light color and mild sweetness.' },
    6: { title: 'PRODUCT 6', description: 'Lavender honey with delicate aroma and soothing properties.' },
    7: { title: 'PRODUCT 7', description: 'Chestnut honey with strong flavor and dark appearance.' },
    8: { title: 'PRODUCT 8', description: 'Clover honey with smooth taste and golden color.' },
    9: { title: 'PRODUCT 9', description: 'Eucalyptus honey with distinctive menthol undertones.' },
    10: { title: 'PRODUCT 10', description: 'Orange blossom honey with citrus notes and light texture.' },
    11: { title: 'PRODUCT 11', description: 'Buckwheat honey with bold flavor and high antioxidants.' },
    12: { title: 'PRODUCT 12', description: 'Sage honey with herbal notes and crystal clear appearance.' },
    13: { title: 'PRODUCT 13', description: 'Linden honey with delicate sweetness and medicinal benefits.' },
    14: { title: 'PRODUCT 14', description: 'Sunflower honey with bright yellow color and mild taste.' },
    15: { title: 'PRODUCT 15', description: 'Thyme honey with aromatic intensity and therapeutic qualities.' }
};

// ============================================
// BOTTLE DATA - Podaci za flaše u sekciji 6
// ============================================
const bottleData = [
    { 
        title: 'GOLDEN HONEY', 
        description: 'Premium wildflower honey with golden hue',
        volume: '500ml',
        type: 'Wildflower',
        color: 0xd4af37 // Zlatna
    },
    { 
        title: 'RUBY NECTAR', 
        description: 'Rich raspberry honey with deep color',
        volume: '750ml',
        type: 'Raspberry',
        color: 0x8b1a1a // Crvena
    },
    { 
        title: 'EMERALD FOREST', 
        description: 'Karakteristike: Forest honey with herbal essence and deep aroma.',
        volume: '500ml',
        type: 'Forest',
        color: 0x2d5016, // Zelena
        variant: {
            color: 0xd4af37,
            title: 'EMERALD FOREST — Gold Edition',
            description: 'Karakteristike: Limited gold finish with reflective sheen and collector display.',
            volume: '500ml',
            type: 'Gold Edition',
            activateLabel: 'Gold',
            resetLabel: 'Original'
        }
    },
    { 
        title: 'SAPPHIRE DREAM', 
        description: 'Lavender honey with calming properties',
        volume: '350ml',
        type: 'Lavender',
        color: 0x1e3a8a // Plava
    },
    { 
        title: 'AMBER GLOW', 
        description: 'Acacia honey with smooth texture',
        volume: '500ml',
        type: 'Acacia',
        color: 0xff8c00 // Narandžasta
    },
    { 
        title: 'CRYSTAL VEIL',
        description: 'Signature crystal bottle captured in photographic detail.',
        volume: '450ml',
        type: 'Special Edition',
        isImage: true,
        image: 'assets/nova-flasa.png',
        imageWidth: 16,
        imageHeight: 57,
        imageScale: 1,
        imageOffset: { x: 0, y: 3, z: 0 }
    }
];

// Pozicije flaša na sceni iz perspektive (~20° nagib)
const stagePositionMap = {
    0: {
        position: { x: 0, y: -0.9, z: 1.5 },
        scale: 0.054,
        rotationY: 0,
        opacity: 1,
        renderOrder: 40
    },
    1: {
        position: { x: 1.28, y: -0.98, z: 1.0 },
        scale: 0.042,
        rotationY: 0,
        opacity: 0.65,
        renderOrder: 30
    },
    2: {
        position: { x: 2.45, y: -1.06, z: 0.65 },
        scale: 0.033,
        rotationY: 0,
        opacity: 0.35,
        renderOrder: 20
    },
    [-1]: {
        position: { x: -1.28, y: -0.98, z: 1.0 },
        scale: 0.042,
        rotationY: 0,
        opacity: 0.65,
        renderOrder: 30
    },
    [-2]: {
        position: { x: -2.45, y: -1.06, z: 0.65 },
        scale: 0.033,
        rotationY: 0,
        opacity: 0.35,
        renderOrder: 20
    }
};

// ============================================
// SETUP SCROLL SNAP - Postavljanje scroll logike i event listener-a
// ============================================
function setupScrollSnap() {
    let wheelDelta = 0;  // Akumulirana vrednost wheel pokreta
    const WHEEL_THRESHOLD = 3;  // Prag za brže animacije nakon više scroll pokušaja
    
    // Pronađi sva dugmad u HTML-u pomoću ID-jeva
    const viewMoreBtn = document.getElementById('viewMoreBtn');    // Dugme na sekciji 1
    const viewMoreBtn2 = document.getElementById('viewMoreBtn2');  // Dugme na sekciji 2
    const scrollUpBtn3 = document.getElementById('scrollUpBtn3');  // Dugme na sekciji 3
    const scrollUpBtn4 = document.getElementById('scrollUpBtn4');  // Dugme na sekciji 4
    const scrollUpBtn5 = document.getElementById('scrollUpBtn5');  // Dugme na sekciji 5
    const scrollUpBtn6 = document.getElementById('scrollUpBtn6');  // Dugme na sekciji 6
    
    // EVENT LISTENERS ZA DUGMAD - klik na dugme prelazi na sledeću sekciju
    
    // Dugme "View More" na sekciji 1 - prelaz na sekciju 2
    viewMoreBtn.addEventListener('click', () => {
        scrollToSection(2, false);  // Pozovi funkciju za prelazak na sekciju 2
    });
    
    // Dugme "View More" na sekciji 2 - prelaz na sekciju 3
    viewMoreBtn2.addEventListener('click', () => {
        scrollToSection(3, false);  // Pozovi funkciju za prelazak na sekciju 3
    });
    
    // Dugme "View More" na sekciji 3 - prelaz na sekciju 4 (HORIZONTALNI SCROLL)
    scrollUpBtn3.addEventListener('click', () => {
        scrollToSection(4, false);  // Pozovi funkciju za prelazak na sekciju 4
    });

    // Dugme "Back to Top" na sekciji 4 - prelaz na sekciju 5
    scrollUpBtn4.addEventListener('click', () => {
        scrollToSection(5, false);  // Pozovi funkciju za prelazak na sekciju 5
    });

    // Dugme "Back to Top" na sekciji 5 - povratak na sekciju 1
    scrollUpBtn5.addEventListener('click', () => {
        scrollToSection(6, false);  // Pozovi funkciju za prelazak na sekciju 6
    });

    // Dugme "Back to Top" na sekciji 6 - povratak na sekciju 1
    scrollUpBtn6.addEventListener('click', () => {
        scrollToSection(1, false);  // Pozovi funkciju za povratak na sekciju 1
    });

    // ============================================
    // TAB SYSTEM - Event listeners za thumbnail grid
    // ============================================
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    const largeImage = document.getElementById('largeImage');
    const tabTitle = document.getElementById('tabTitle');
    const tabDescription = document.getElementById('tabDescription');

    thumbnails.forEach((thumb) => {
        thumb.addEventListener('click', function() {
            const tabNumber = parseInt(this.getAttribute('data-tab'));
            
            // Ukloni active klasu sa svih thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));
            
            // Dodaj active klasu na kliknut thumbnail
            this.classList.add('active');
            
            // Animacija promene slike (fade out -> fade in)
            largeImage.style.opacity = '0';
            
            setTimeout(() => {
                // Promeni sliku (ako postoji)
                largeImage.src = `assets/p${tabNumber}.jpg`;
                
                // Promeni tekst
                tabTitle.textContent = tabData[tabNumber].title;
                tabDescription.textContent = tabData[tabNumber].description;
                
                // Fade in
                largeImage.style.opacity = '1';
            }, 300);
        });
    });

    // Postavi prvi tab kao aktivan na početku
    if (thumbnails.length > 0) {
        thumbnails[0].classList.add('active');
    }

    // ============================================
    // BOTTLE SLIDER - Event listeners za kružni slajder flaša
    // ============================================
    bottleSlots = Array.from(document.querySelectorAll('.bottle-slot'));
    bottleActionsContainer = document.getElementById('bottleActions');
    bottleVariantButton = document.getElementById('bottleVariantToggle');
    const prevBottleBtn = document.getElementById('prevBottle');
    const nextBottleBtn = document.getElementById('nextBottle');

    // Klik na slot
    bottleSlots.forEach((slot, index) => {
        slot.addEventListener('click', () => {
            changeBottle(index);
        });
    });

    // Previous button
    if (prevBottleBtn) {
        prevBottleBtn.addEventListener('click', () => {
            const newIndex = (currentBottleIndex - 1 + bottleData.length) % bottleData.length;
            changeBottle(newIndex);
        });
    }

    // Next button
    if (nextBottleBtn) {
        nextBottleBtn.addEventListener('click', () => {
            const newIndex = (currentBottleIndex + 1) % bottleData.length;
            changeBottle(newIndex);
        });
    }

    if (bottleVariantButton) {
        bottleVariantButton.addEventListener('click', () => {
            if (currentBottleIndex !== GOLD_BOTTLE_INDEX || !bottleData[GOLD_BOTTLE_INDEX].variant) {
                return;
            }

            const targetState = !goldVariantActive;
            setBottleVariant(targetState);
            updateBottleUI(currentBottleIndex);
        });
    }

    // Inicijalno rasporedi slotove
    updateStageLayout(currentBottleIndex);
    
    // ============================================
    // WHEEL EVENT - Scroll pomoću točkića miša
    // ============================================
    window.addEventListener('wheel', (e) => {
        e.preventDefault();  // Spreči default scroll ponašanje browsera
        
        const now = Date.now();  // Trenutno vreme u milisekundama
        
        // Reset scroll pokušaja ako je prošlo više od 500ms od poslednjeg scrolla
        if (now - lastScrollTime > 500) {
            scrollAttempts = 0;  // Resetuj broj pokušaja
            wheelDelta = 0;      // Resetuj wheel delta
        }
        
        lastScrollTime = now;         // Zapamti vreme ovog scrolla
        wheelDelta += e.deltaY;       // Akumuliraj wheel pokret (+ = dole, - = gore)
        
        // Ako je wheel pokret značajan (>10), povećaj broj pokušaja
        if (Math.abs(e.deltaY) > 10) {
            scrollAttempts++;
        }
        
        // Ako je animacija u toku, ignoriši scroll (spreči preklapanje animacija)
        if (isAnimating) {
            return;
        }
        
        // Ako je wheelDelta dovoljno velika (>50), izvrši scroll na sledeću/prethodnu sekciju
        if (Math.abs(wheelDelta) > 50) {
            // SCROLL DOLE (wheelDelta > 0)
            if (wheelDelta > 0 && currentSection === 1) {
                scrollToSection(2, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 1 → 2
                wheelDelta = 0;  // Resetuj delta
            } else if (wheelDelta > 0 && currentSection === 2) {
                scrollToSection(3, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 2 → 3
                wheelDelta = 0;
            } else if (wheelDelta > 0 && currentSection === 3) {
                scrollToSection(4, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 3 → 4 (HORIZONTAL)
                wheelDelta = 0;
            } else if (wheelDelta > 0 && currentSection === 4) {
                scrollToSection(5, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 4 → 5 (HORIZONTAL)
                wheelDelta = 0;
            } else if (wheelDelta > 0 && currentSection === 5) {
                scrollToSection(6, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 5 → 6 (HORIZONTAL)
                wheelDelta = 0;
            } 
            // SCROLL GORE (wheelDelta < 0)
            else if (wheelDelta < 0 && currentSection === 2) {
                scrollToSection(1, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 2 → 1
                wheelDelta = 0;
            } else if (wheelDelta < 0 && currentSection === 3) {
                scrollToSection(2, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 3 → 2
                wheelDelta = 0;
            } else if (wheelDelta < 0 && currentSection === 4) {
                scrollToSection(3, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 4 → 3 (HORIZONTAL nazad)
                wheelDelta = 0;
            } else if (wheelDelta < 0 && currentSection === 5) {
                scrollToSection(4, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 5 → 4 (HORIZONTAL nazad)
                wheelDelta = 0;
            } else if (wheelDelta < 0 && currentSection === 6) {
                scrollToSection(5, scrollAttempts >= WHEEL_THRESHOLD);  // Sekcija 6 → 5 (HORIZONTAL nazad)
                wheelDelta = 0;
            }
        }
    }, { passive: false });  // passive: false omogućava preventDefault()
    
    // Interval koji resetuje scroll pokušaje ako korisnik prestane da scrolluje
    setInterval(() => {
        const now = Date.now();
        if (now - lastScrollTime > 1000) {  // Ako je prošlo više od 1s
            scrollAttempts = 0;  // Resetuj broj pokušaja
        }
    }, 500);  // Provera svakih 500ms
}

// ============================================
// SCROLL TO SECTION - Glavna funkcija za prelazak između sekcija
// ============================================
function scrollToSection(sectionNumber, skipAnimation = false) {
    // Ako smo već na toj sekciji, ne radi ništa
    if (currentSection === sectionNumber) return;
    
    const previousSection = currentSection;  // Zapamti prethodnu sekciju
    currentSection = sectionNumber;          // Postavi novu trenutnu sekciju
    scrollAttempts = 0;                      // Resetuj scroll pokušaje
    
    // Pronađi HTML elemente sekcija i horizontal wrapper
    const section1 = document.querySelector('[data-section="1"]');
    const section2 = document.querySelector('[data-section="2"]');
    const section3 = document.querySelector('[data-section="3"]');
    const section4 = document.querySelector('[data-section="4"]');
    const section5 = document.querySelector('[data-section="5"]');
    const section6 = document.querySelector('[data-section="6"]');
    const horizontalWrapper = document.querySelector('.horizontal-wrapper');  // Wrapper za sekcije 3, 4, 5 i 6
    
    // Pronađi dugmad
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    const viewMoreBtn2 = document.getElementById('viewMoreBtn2');
    const scrollUpBtn3 = document.getElementById('scrollUpBtn3');
    const scrollUpBtn4 = document.getElementById('scrollUpBtn4');
    const scrollUpBtn5 = document.getElementById('scrollUpBtn5');
    const scrollUpBtn6 = document.getElementById('scrollUpBtn6');
    
    // ============================================
    // SEKCIJA 1 - Hero sekcija (početna strana)
    // ============================================
    if (sectionNumber === 1) {
        // Vertikalni scroll do sekcije 1
        section1.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Resetuj horizontal scroll (vrati na poziciju 0)
        if (horizontalWrapper) {
            horizontalWrapper.style.transform = 'translateX(0)';
        }
        
        // Prikaži/sakrij dugmad
        viewMoreBtn.classList.remove('hidden');    // Prikaži dugme "View More"
        viewMoreBtn2.classList.add('hidden');      // Sakrij dugme sekcije 2
        scrollUpBtn3.classList.remove('visible');  // Sakrij dugme sekcije 3
        scrollUpBtn4.classList.remove('visible');  // Sakrij dugme sekcije 4
        
        // Prikaži/sakrij 3D modele
        if (model) model.visible = true;    // Prikaži model 1 (wax seal)
        if (model3) model3.visible = false; // Sakrij model 3 (flaša)
    hideStageBottles();
        
        // Pokreni animaciju za sekciju 1
        animateToSection1(skipAnimation);
        
    // ============================================
    // SEKCIJA 2 - Druga sekcija (tekst sa modelom levo)
    // ============================================
    } else if (sectionNumber === 2) {
        // Vertikalni scroll do sekcije 2
        section2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Resetuj horizontal scroll
        if (horizontalWrapper) {
            horizontalWrapper.style.transform = 'translateX(0)';
        }
        
        // Prikaži/sakrij dugmad
        viewMoreBtn.classList.add('hidden');       // Sakrij dugme sekcije 1
        viewMoreBtn2.classList.remove('hidden');   // Prikaži dugme "View More"
        scrollUpBtn3.classList.remove('visible');  // Sakrij dugme sekcije 3
        scrollUpBtn4.classList.remove('visible');  // Sakrij dugme sekcije 4
        
        // Prikaži/sakrij 3D modele
        if (model) model.visible = true;    // Prikaži model 1 (wax seal)
        if (model3) model3.visible = false; // Sakrij model 3 (flaša)
    hideStageBottles();
        
        // Pokreni animaciju za sekciju 2
        animateToSection2(skipAnimation);
        
    // ============================================
    // SEKCIJA 3 - Treća sekcija (svetlo plava pozadina, flaša desno)
    // ============================================
    } else if (sectionNumber === 3) {
        // Ako dolazimo iz sekcije 1 ili 2, uradi vertikalni scroll do horizontal wrapper-a
        if (previousSection <= 2) {
            horizontalWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Resetuj horizontalnu poziciju (vrati na sekciju 3, ne 4)
        if (horizontalWrapper) {
            horizontalWrapper.style.transition = 'transform 1s ease-in-out';  // Smooth tranzicija
            horizontalWrapper.style.transform = 'translateX(0)';  // Pozicija 0 = sekcija 3 vidljiva
        }
        
        // Prikaži/sakrij dugmad
        viewMoreBtn.classList.add('hidden');      // Sakrij dugme sekcije 1
        viewMoreBtn2.classList.add('hidden');     // Sakrij dugme sekcije 2
        scrollUpBtn3.classList.add('visible');    // Prikaži dugme "View More" (prelaz na sekciju 4)
        scrollUpBtn4.classList.remove('visible'); // Sakrij dugme sekcije 4
        
        // Prikaži/sakrij 3D modele
        if (model) model.visible = false;  // Sakrij model 1 (wax seal)
        if (model3) model3.visible = true; // Prikaži model 3 (flaša)
    hideStageBottles();
        
        // Pokreni animaciju za sekciju 3
        animateToSection3(skipAnimation);
        
    // ============================================
    // SEKCIJA 4 - Četvrta sekcija (HORIZONTALNI SCROLL iz sekcije 3)
    // ============================================
    } else if (sectionNumber === 4) {
        // Ako dolazimo iz sekcije 1 ili 2, prvo uradi vertikalni scroll do wrapper-a
        if (previousSection <= 2) {
            horizontalWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // HORIZONTAL SCROLL - pomeri wrapper levo za 100vw (jedna širina ekrana)
        if (horizontalWrapper) {
            horizontalWrapper.style.transition = 'transform 1s ease-in-out';  // Smooth tranzicija
            horizontalWrapper.style.transform = 'translateX(-100vw)';  // Pomeri levo - sekcija 4 vidljiva
        }

        // Prikaži/sakrij dugmad
        viewMoreBtn.classList.add('hidden');      // Sakrij dugme sekcije 1
        viewMoreBtn2.classList.add('hidden');     // Sakrij dugme sekcije 2
        scrollUpBtn3.classList.remove('visible'); // Sakrij dugme sekcije 3
        scrollUpBtn4.classList.add('visible');    // Prikaži dugme "View More" (prelaz na sekciju 5)
        scrollUpBtn5.classList.remove('visible'); // Sakrij dugme sekcije 5

        // Prikaži/sakrij 3D modele
        if (model) model.visible = false;  // Sakrij model 1 (wax seal)
        if (model3) model3.visible = true; // Prikaži model 3 (flaša) - MORA BITI VIDLJIVA!
    hideStageBottles();

        // Pokreni animaciju za sekciju 4
        animateToSection4(skipAnimation);
    
    // ============================================
    // SEKCIJA 5 - Peta sekcija (Tab sistem, ulazi sa desne strane)
    // ============================================
    } else if (sectionNumber === 5) {
        // Ako dolazimo iz sekcije 1 ili 2, prvo uradi vertikalni scroll do wrapper-a
        if (previousSection <= 2) {
            horizontalWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // HORIZONTAL SCROLL - pomeri wrapper levo za 200vw (dve širine ekrana)
        if (horizontalWrapper) {
            horizontalWrapper.style.transition = 'transform 1s ease-in-out';
            horizontalWrapper.style.transform = 'translateX(-200vw)';  // Pomeri levo - sekcija 5 vidljiva
        }

        // Prikaži/sakrij dugmad
        viewMoreBtn.classList.add('hidden');      // Sakrij dugme sekcije 1
        viewMoreBtn2.classList.add('hidden');     // Sakrij dugme sekcije 2
        scrollUpBtn3.classList.remove('visible'); // Sakrij dugme sekcije 3
        scrollUpBtn4.classList.remove('visible'); // Sakrij dugme sekcije 4
        scrollUpBtn5.classList.add('visible');    // Prikaži dugme "View More" (prelaz na sekciju 6)
        scrollUpBtn6.classList.remove('visible'); // Sakrij dugme sekcije 6

        // Prikaži/sakrij 3D modele - sakrij sve modele u sekciji 5
        if (model) model.visible = false;
        if (model3) model3.visible = false;
    hideStageBottles();

        // Pokreni animaciju za sekciju 5
        animateToSection5(skipAnimation);
    
    // ============================================
    // SEKCIJA 6 - Šesta sekcija (Kružni slajder flaša)
    // ============================================
    } else if (sectionNumber === 6) {
        // Ako dolazimo iz sekcije 1 ili 2, prvo uradi vertikalni scroll do wrapper-a
        if (previousSection <= 2) {
            horizontalWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // HORIZONTAL SCROLL - pomeri wrapper levo za 300vw (tri širine ekrana)
        if (horizontalWrapper) {
            horizontalWrapper.style.transition = 'transform 1s ease-in-out';
            horizontalWrapper.style.transform = 'translateX(-300vw)';  // Pomeri levo - sekcija 6 vidljiva
        }

        // Prikaži/sakrij dugmad
        viewMoreBtn.classList.add('hidden');
        viewMoreBtn2.classList.add('hidden');
        scrollUpBtn3.classList.remove('visible');
        scrollUpBtn4.classList.remove('visible');
        scrollUpBtn5.classList.remove('visible');
        scrollUpBtn6.classList.add('visible');    // Prikaži dugme "Back to Top"

        // Prikaži/sakrij 3D modele - sakrij sve osim trenutne flaše
        if (model) model.visible = false;
        if (model3) model3.visible = false;

        // Pokreni animaciju za sekciju 6
        animateToSection6(skipAnimation);
        
        // Prikaži prvu flašu
        if (bottleModels.length > 0) {
            changeBottle(currentBottleIndex, { force: true });
        }
    }
}

// ============================================
// ANIMATION FUNCTIONS - Funkcije za animaciju modela između sekcija
// ============================================

// Animacija ka prvoj sekciji - vraća model 1 (wax seal) u početnu poziciju
function animateToSection1(instant = false) {
    if (!model) return;  // Ako model nije učitan, izađi
    isAnimating = true;  // Zaključaj animaciju
    
    // Trajanje animacije - brže ako je instant (0.3s), sporije inače (1.5s)
    const duration = instant ? 0.3 : 1.5;
    
    // GSAP timeline - lanac animacija koje se izvršavaju zajedno
    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false;  // Otključaj animaciju kada se završi
        }
    });

    // Vrati kameru u početno stanje (sekcija 1)
    tl.to(camera.position, {
        x: 0,  // Centar ekrana (levo-desno)
        y: 0,  // Centar ekrana (gore-dole)
        z: 5,  // Udaljenost kamere od scene
        duration: duration,
        ease: "power2.inOut"  // Smooth easing
    })
    // Vrati FOV kamere na početnu vrednost (45°)
    .to(camera, {
        fov: 45,  // Field of View - širok ugao gledanja
        onUpdate: () => camera.updateProjectionMatrix(),  // Ažuriraj projekciju kamere
        duration: duration,
        ease: "power2.inOut"
    }, '<')  // '<' znači da počinje istovremeno sa prethodnom animacijom
    // Vrati poziciju modela u centar ekrana
    .to(model.position, {
        x: 0,  // Centar (levo-desno)
        y: 0,  // Centar (gore-dole)
        z: 1,  // Dubina u sceni
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<')
    // Vrati veličinu modela na početnu (veliku)
    .to(model.scale, {
        x: 0.007,  // Velika veličina za sekciju 1
        y: 0.007,
        z: 0.007,
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<')
    // Vrati rotaciju modela na 0 (bez okretanja)
    .to(model.rotation, {
        y: 0,  // Bez rotacije po Y osi
        z: 0,  // Bez rotacije po Z osi
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<');
}

// Animacija ka drugoj sekciji - pomera model 1 (wax seal) levo i smanjuje ga
function animateToSection2(instant = false) {
    if (!model) return;  // Ako model nije učitan, izađi
    isAnimating = true;  // Zaključaj animaciju
    
    const duration = instant ? 0.3 : 1.5;
    
    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false;  // Otključaj animaciju
        }
    });
    
    // Pomeri model levo (na levu stranu ekrana)
    tl.to(model.position, {
        x: -2.5,  // Leva strana ekrana
        y: 0,     // Centar po visini
        z: 1,     // Dubina u sceni
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    })
    // Smanji model (manji nego u sekciji 1)
    .to(model.scale, {
        x: 0.002,  // Mnogo manja veličina
        y: 0.002,
        z: 0.002,
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<')
    // Rotiraj model za 360° (pun krug)
    .to(model.rotation, {
        y: model.rotation.y + Math.PI * 2,  // Dodaj 360° na trenutnu rotaciju
        z: 0,  // Bez nagiba
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<');
}

// Animacija ka trećoj sekciji - prikazuje objekat 2 (flašu)
function animateToSection3(instant = false) {
    if (!model3) return;
    isAnimating = true;
    
    // Trajanje animacije - brže ako je instant, sporije za normalan prelaz
    const duration = instant ? 0.3 : 1.5;
    
    // Resetuj početnu poziciju i rotaciju pre animacije
    model3.position.set(2, -1.6, 1);
    model3.rotation.x = -Math.PI / 2;
    model3.rotation.y = 0;
    model3.rotation.z = 0;
    model3.scale.set(0.027, 0.027, 0.027);
    
    // GSAP timeline - lanac animacija
    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false; // Oslobodi animaciju kada se završi
        }
    });
    
    // Vrati kameru u normalnu poziciju (ako dolazimo iz sekcije 4)
    tl.to(camera.position, {
        x: 0,    // Centriraj kameru
        y: 0,    // Centriraj kameru
        z: 5,    // Vrati kameru na normalnu distancu
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    })
    // Vrati FOV kamere na normalnu vrednost
    .to(camera, {
        fov: 45,  // Vrati na normalan FOV (iz zoom-a)
        onUpdate: () => camera.updateProjectionMatrix(),
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<')
    // Animiraj model3 (flaša) na desnoj strani ekrana - uspravna pozicija
    .to(model3.position, {
        x: 2,  // Pozicija X: desna polovina ekrana
        y: -1.6,    // Pozicija Y: centar po visini
        z: 1,    // Pozicija Z: dubina u sceni
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<')
    .to(model3.scale, {
        x: 0.027,  // Veličina X - srednja veličina za sekciju 3
        y: 0.027,  // Veličina Y
        z: 0.027,  // Veličina Z
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<')  // '<' znači da počinje istovremeno sa prethodnom animacijom
    .to(model3.rotation, {
        x: -Math.PI / 2, // Rotacija po X: -90° (uspravna flaša)
        y: 0,            // Rotacija po Y: 0° (bez okretanja)
        z: 0,            // Rotacija po Z: 0° (bez nagiba)
        duration: duration,
        ease: instant ? "power1.out" : "power2.inOut"
    }, '<');
}

// Animacija ka četvrtoj sekciji - zoom efekat na flašu
function animateToSection4(instant = false) {
    if (!model3) return;
    isAnimating = true;

    // Trajanje animacije
    const duration = instant ? 0.4 : 1.8;

    // GSAP timeline za animaciju
    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false; // Oslobodi animaciju
        }
    });

    // Animacija kamere - pomeraj kameru bliže objektu (zoom efekat)
    tl.to(camera.position, {
        x: 0,  // Centriraj kameru po X osi
        y: 0,  // Centriraj kameru po Y osi
        z: 10,  // Približi kameru objektu (bilo model3.position.z + 2)
        duration: duration/4,
        ease: "power2.inOut"
    })
    // Animacija FOV kamere - smanji Field of View za dodatni zoom efekat
    .to(camera, {
        fov: 15, // Smanji FOV sa 45° na 35° (zoomira)
        onUpdate: () => camera.updateProjectionMatrix(), // Ažuriraj projekciju kamere
        duration: duration/2,
        ease: "power2.inOut"
    }, '<')
    // Animacija pozicije modela - pomeri objekat u centar ekrana
    .to(model3.position, {
        x: 0,  // Pomeri objekat u centar ekrana (levo-desno)
        y: -7,  // Zadrži Y poziciju
        z: 1,  // Zadrži Z poziciju
        duration: duration/4,
        ease: "power2.inOut"
    }, '<')
    // Animacija veličine modela - uvećaj objekat
    .to(model3.scale, {
        x: 0.1,  // Uvećaj objekat
        y: 0.1,
        z: 0.1,
        duration: duration/4,
        ease: "power2.inOut"
    }, '<');
}

// Animacija ka petoj sekciji - bez 3D modela, čista sekcija
function animateToSection5(instant = false) {
    isAnimating = true;
    
    const duration = instant ? 0.3 : 1.5;
    
    // Timeline za kameru (vrati u početno stanje ako je potrebno)
    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false;
        }
    });
    
    // Vrati kameru u normalno stanje
    tl.to(camera.position, {
        x: 0,
        y: 0,
        z: 5,
        duration: duration,
        ease: "power2.inOut"
    })
    .to(camera, {
        fov: 45,
        onUpdate: () => camera.updateProjectionMatrix(),
        duration: duration,
        ease: "power2.inOut"
    }, '<');
}

// Animacija ka šestoj sekciji - kružni slajder flaša
function animateToSection6(instant = false) {
    isAnimating = true;
    
    const duration = instant ? 0.3 : 1.5;
    
    const tl = gsap.timeline({
        onComplete: () => {
            isAnimating = false;
        }
    });
    
    // Vrati kameru u normalno stanje
    tl.to(camera.position, {
        x: 0,
        y: 2,
        z: 8,
        duration: duration,
        ease: "power2.inOut"
    })
    .to(camera, {
        fov: 55,
        onUpdate: () => camera.updateProjectionMatrix(),
        duration: duration,
        ease: "power2.inOut"
    }, '<');
}

// ============================================
// CHANGE BOTTLE - Funkcija za promenu flaše u sekciji 6
// ============================================
function changeBottle(newIndex, options = {}) {
    if (bottleData.length === 0) return;

    const total = bottleData.length;
    newIndex = ((newIndex % total) + total) % total;

    const { instant = false, force = false } = options;

    if (!force && newIndex === currentBottleIndex) {
        return;
    }

    currentBottleIndex = newIndex;

    updateStageLayout(newIndex);
    updateBottleUI(newIndex);
    arrangeBottleModels(newIndex, instant);

    if (newIndex === GOLD_BOTTLE_INDEX && bottleData[GOLD_BOTTLE_INDEX].variant) {
        setBottleVariant(goldVariantActive);
    }
}

// ============================================
// UPDATE STAGE LAYOUT - Postavi flaše na pozicije na elipsi
// ============================================
function updateStageLayout(activeIndex) {
    if (!bottleSlots.length) return;

    const total = bottleSlots.length;

    bottleSlots.forEach((slot, index) => {
        slot.classList.remove('slot-center', 'slot-left-1', 'slot-left-2', 'slot-right-1', 'slot-right-2', 'active');

        let offset = (index - activeIndex + total) % total;
        if (offset > total / 2) {
            offset -= total;
        }

        if (offset === 0) {
            slot.classList.add('slot-center', 'active');
            slot.setAttribute('aria-selected', 'true');
        } else if (offset === 1 || offset === -(total - 1)) {
            slot.classList.add('slot-right-1');
            slot.setAttribute('aria-selected', 'false');
        } else if (offset === 2 || offset === -(total - 2)) {
            slot.classList.add('slot-right-2');
            slot.setAttribute('aria-selected', 'false');
        } else if (offset === -1 || offset === (total - 1)) {
            slot.classList.add('slot-left-1');
            slot.setAttribute('aria-selected', 'false');
        } else if (offset === -2 || offset === (total - 2)) {
            slot.classList.add('slot-left-2');
            slot.setAttribute('aria-selected', 'false');
        } else {
            slot.setAttribute('aria-selected', 'false');
        }
    });
}

// Sakrij sve flaše sa stage-a (koristi se prilikom izlaska iz sekcije 6)
function hideStageBottles() {
    if (!bottleModels.length) return;

    bottleModels.forEach((bottle) => {
        if (!bottle) return;

        const materials = bottle.userData.stageMaterials || [];
        materials.forEach((mat) => {
            mat.opacity = 0;
            mat.needsUpdate = true;
        });

        bottle.visible = false;
    });
}

// Rasporedi flaše po perspektivnoj elipsi i animiraj prelaze
function arrangeBottleModels(activeIndex, instant = false) {
    if (!bottleModels.length) return;

    const total = bottleModels.length;
    const duration = instant ? 0.01 : 0.65;

    bottleModels.forEach((bottle, index) => {
        if (!bottle) return;

        let offset = (index - activeIndex + total) % total;
        if (offset > total / 2) {
            offset -= total;
        }

        const target = stagePositionMap[offset];
        const materials = bottle.userData.stageMaterials || [];

        if (!target) {
            if (!instant) {
                materials.forEach((mat) => {
                    gsap.to(mat, {
                        opacity: 0,
                        duration: duration * 0.8,
                        ease: "power2.out",
                        onUpdate: () => {
                            mat.needsUpdate = true;
                        }
                    });
                });
            } else {
                materials.forEach((mat) => {
                    mat.opacity = 0;
                    mat.needsUpdate = true;
                });
            }

            bottle.visible = false;
            return;
        }

        bottle.visible = true;
        bottle.renderOrder = target.renderOrder;

        const userData = bottle.userData || {};
        const isImage = !!userData.isImage;
        const posOffset = userData.positionOffset || {};
        const scaleMultiplier = typeof userData.scaleMultiplier === 'number' ? userData.scaleMultiplier : 1;
        const rotationOverride = userData.rotationOverride || {};

        const targetPosition = {
            x: target.position.x + (posOffset.x || 0),
            y: target.position.y + (posOffset.y || 0),
            z: target.position.z + (posOffset.z || 0)
        };

        const finalScale = target.scale * scaleMultiplier;

        const rotationX = rotationOverride.x !== undefined
            ? rotationOverride.x
            : (isImage ? 0 : -Math.PI / 2);
        const rotationY = rotationOverride.y !== undefined ? rotationOverride.y : target.rotationY;
        const rotationZ = rotationOverride.z !== undefined ? rotationOverride.z : 0;

        if (instant) {
            bottle.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
            bottle.scale.set(finalScale, finalScale, finalScale);
            bottle.rotation.set(rotationX, rotationY, rotationZ);
            materials.forEach((mat) => {
                mat.opacity = target.opacity;
                mat.needsUpdate = true;
            });
        } else {
            gsap.to(bottle.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration,
                ease: "power2.inOut"
            });

            gsap.to(bottle.scale, {
                x: finalScale,
                y: finalScale,
                z: finalScale,
                duration,
                ease: "power2.inOut"
            });

            gsap.to(bottle.rotation, {
                x: rotationX,
                y: rotationY,
                z: rotationZ,
                duration,
                ease: "power2.inOut"
            });

            materials.forEach((mat) => {
                gsap.to(mat, {
                    opacity: target.opacity,
                    duration: duration * 0.85,
                    ease: "power2.out",
                    onUpdate: () => {
                        mat.needsUpdate = true;
                    }
                });
            });
        }
    });
}

// Postavi boju flaše na osnovu zadatog heksa
function applyBottleColor(index, colorHex) {
    const bottle = bottleModels[index];
    if (!bottle || (bottle.userData && bottle.userData.isImage)) return;

    const materials = bottle.userData.stageMaterials || [];
    materials.forEach((mat) => {
        if (!mat) return;
        mat.color.setHex(colorHex);
        mat.needsUpdate = true;
    });

    bottle.userData.currentColor = colorHex;
}

// Uključi ili isključi Gold varijantu za ciljanu flašu
function setBottleVariant(active) {
    if (!bottleData[GOLD_BOTTLE_INDEX] || !bottleData[GOLD_BOTTLE_INDEX].variant) {
        goldVariantActive = false;
        return;
    }

    goldVariantActive = !!active;

    const targetBottle = bottleModels[GOLD_BOTTLE_INDEX];
    if (targetBottle && targetBottle.userData.stageMaterials) {
        const baseColor = bottleData[GOLD_BOTTLE_INDEX].color;
        const variantColor = bottleData[GOLD_BOTTLE_INDEX].variant.color || baseColor;
        const resolvedColor = goldVariantActive ? variantColor : baseColor;
        applyBottleColor(GOLD_BOTTLE_INDEX, resolvedColor);
    }

    if (bottleVariantButton && bottleData[GOLD_BOTTLE_INDEX].variant) {
        const labels = bottleData[GOLD_BOTTLE_INDEX].variant;
        const activateLabel = labels.activateLabel || 'Gold';
        const resetLabel = labels.resetLabel || 'Original';
        bottleVariantButton.textContent = goldVariantActive ? resetLabel : activateLabel;
        bottleVariantButton.classList.toggle('is-alt', goldVariantActive);
        bottleVariantButton.setAttribute('aria-pressed', goldVariantActive ? 'true' : 'false');
    }
}

// ============================================
// UPDATE BOTTLE UI - Ažuriranje teksta i slider itema
// ============================================
function updateBottleUI(index) {
    const data = bottleData[index];
    if (!data) return;

    const variantData = data.variant;
    const variantActive = index === GOLD_BOTTLE_INDEX && goldVariantActive && !!variantData;
    const titleText = variantActive && variantData.title ? variantData.title : data.title;
    const descriptionText = variantActive && variantData.description ? variantData.description : data.description;
    const volumeText = variantActive && variantData && variantData.volume ? variantData.volume : data.volume;
    const typeText = variantActive && variantData && variantData.type ? variantData.type : data.type;
    const activateLabel = variantData && variantData.activateLabel ? variantData.activateLabel : 'Gold';
    const resetLabel = variantData && variantData.resetLabel ? variantData.resetLabel : 'Original';
    
    // Ažuriraj tekst
    const titleEl = document.getElementById('bottleTitle');
    const descEl = document.getElementById('bottleDescription');
    const volumeEl = document.getElementById('bottleVolume');
    const typeEl = document.getElementById('bottleType');
    
    if (titleEl) {
        gsap.to(titleEl, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => {
                titleEl.textContent = titleText;
                gsap.to(titleEl, { opacity: 1, y: 0, duration: 0.3 });
            }
        });
    }
    
    if (descEl) {
        gsap.to(descEl, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                descEl.textContent = descriptionText;
                gsap.to(descEl, { opacity: 1, duration: 0.3 });
            }
        });
    }
    
    if (volumeEl) volumeEl.textContent = volumeText;
    if (typeEl) typeEl.textContent = typeText;

    if (bottleActionsContainer && bottleVariantButton) {
        if (index === GOLD_BOTTLE_INDEX && variantData) {
            bottleActionsContainer.classList.add('active');
            bottleVariantButton.textContent = variantActive ? resetLabel : activateLabel;
            bottleVariantButton.classList.toggle('is-alt', variantActive);
            bottleVariantButton.setAttribute('aria-pressed', variantActive ? 'true' : 'false');
        } else {
            bottleActionsContainer.classList.remove('active');
            bottleVariantButton.classList.remove('is-alt');
            bottleVariantButton.setAttribute('aria-pressed', 'false');
        }
    }
    
    // Ažuriraj active klasu na slider items
    if (bottleSlots.length) {
        bottleSlots.forEach((slot, i) => {
            slot.classList.toggle('active', i === index);
            slot.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
    }
}

// ============================================
// ANIMATION LOOP - Glavna petlja za renderovanje i lebdenje efekat
// ============================================
let time = 0;  // Promenljiva za vreme - raste svaki frame (za lebdenje efekat)

function animate() {
    requestAnimationFrame(animate);  // Pozovi ovu funkciju ponovo u sledećem frame-u (60fps)
    
    time += 0.01;  // Povećaj vreme (kontroliše brzinu lebdenja)
    
    // LEBDENJE EFEKAT - samo u prvoj sekciji i samo za model 1 (wax seal)
    // Ovaj efekat pravi blagu animaciju gore-dole i levo-desno + blagi nagib
    if (model && currentSection === 1 && !isAnimating) {
        const baseY = 0;  // Bazna Y pozicija (centar)
        const baseX = 0;  // Bazna X pozicija (centar)
        
        // Sine wave za Y poziciju (gore-dole lebdenje)
        model.position.y = baseY + Math.sin(time) * 0.01;  // Amplituda 0.01 (malo pomeranje)
        
        // Cosine wave za X poziciju (levo-desno lebdenje, sporije)
        model.position.x = baseX + Math.cos(time * 0.7) * 0.008;  // Amplituda 0.008, sporije (0.7x)
        
        // Blagi nagib (rotacija po Z osi)
        model.rotation.z = Math.sin(time * 0.5) * 0.02;  // Amplituda 0.02, još sporije (0.5x)
    }
    
    // Renderuj scenu - "nacrtaj" sve objekte na ekran kroz kameru
    renderer.render(scene, camera);
}

// Pokreni animation loop (počinje beskonačna petlja)
animate();

// ============================================
// WINDOW RESIZE - Prilagodi kameru i renderer kada se promeni veličina prozora
// ============================================
window.addEventListener('resize', () => {
    // Ažuriraj aspect ratio kamere na novu širinu/visinu prozora
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();  // Ažuriraj projekciju sa novim aspect ratio
    
    // Ažuriraj veličinu renderera na novu veličinu prozora
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// PAGE LOAD RESET - Resetuj stranicu u početno stanje kada se učita
// ============================================
window.addEventListener('load', () => {
    // Forsiraj scroll na vrh i resetuj poziciju
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 0);
});

window.addEventListener('DOMContentLoaded', () => {
    currentSection = 1;  // Postavi trenutnu sekciju na 1 (početna)
    
    // Forsiraj scroll na vrh stranice odmah
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Resetuj browser history state
    if (window.history && window.history.scrollRestoration) {
        window.history.scrollRestoration = 'manual';
    }
    
    // Resetuj horizontal wrapper na poziciju 0
    const horizontalWrapper = document.querySelector('.horizontal-wrapper');
    if (horizontalWrapper) {
        horizontalWrapper.style.transition = 'none'; // Bez animacije
        horizontalWrapper.style.transform = 'translateX(0)';
        // Vrati tranziciju nakon kratkog delay-a
        setTimeout(() => {
            horizontalWrapper.style.transition = 'transform 1s ease-in-out';
        }, 100);
    }
    
    // Pronađi sekcije
    const section1 = document.querySelector('[data-section="1"]');
    const section2 = document.querySelector('[data-section="2"]');
    
    // Scroll na sekciju 1
    if (section1) {
        section1.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    
    // Prikaži sekciju 1, sakrij sekciju 2
    if (section1) section1.classList.remove('hidden');
    if (section2) section2.classList.add('hidden');
    
    // Pronađi dugmad
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    const viewMoreBtn2 = document.getElementById('viewMoreBtn2');
    const scrollUpBtn3 = document.getElementById('scrollUpBtn3');
    const scrollUpBtn4 = document.getElementById('scrollUpBtn4');
    const scrollUpBtn5 = document.getElementById('scrollUpBtn5');
    const scrollUpBtn6 = document.getElementById('scrollUpBtn6');
    
    // Prikaži dugme na sekciji 1, sakrij ostala
    if (viewMoreBtn) viewMoreBtn.classList.remove('hidden');
    if (viewMoreBtn2) viewMoreBtn2.classList.add('hidden');
    if (scrollUpBtn3) scrollUpBtn3.classList.remove('visible');
    if (scrollUpBtn4) scrollUpBtn4.classList.remove('visible');
    if (scrollUpBtn5) scrollUpBtn5.classList.remove('visible');
    if (scrollUpBtn6) scrollUpBtn6.classList.remove('visible');
    
    // Resetuj model 1 u početnu poziciju
    if (model) {
        model.visible = true;  // Prikaži model
        model.position.set(0, 0, 1);  // Centar ekrana, dubina 1
        model.scale.set(0.007, 0.007, 0.007);  // Velika veličina
        model.rotation.y = 0;
        model.rotation.z = 0;
    }
    
    // Sakrij ostale modele
    if (model3) model3.visible = false;
    if (bottleModels.length > 0) {
        bottleModels.forEach(bottle => {
            bottle.visible = false;
        });
    }
    
    // Resetuj kameru
    camera.position.set(0, 0, 5);
    camera.fov = 45;
    camera.updateProjectionMatrix();
});

// ============================================
// KRAJ KODA
// ============================================

/*
REZIME - Kako funkcioniše ovaj kod:

1. THREE.JS SETUP:
   - Scene (scena) - prostor gde se nalaze svi 3D objekti
   - Camera (kamera) - "oko" kroz koje gledamo scenu
   - Renderer (renderer) - "crta" scenu na ekran
   - Lights (svetla) - osvetljavaju objekte (ambient, directional, point)

2. MODELI:
   - model (FinalBaseMesh.obj) - Wax seal (crveni pečat) - koristi se u sekcijama 1 i 2
   - model3 (FinalBaseMesh - Copy.obj) - Flaša - koristi se u sekcijama 3 i 4

3. SCROLL LOGIKA:
   - setupScrollSnap() - postavlja event listeners za dugmad i wheel
   - scrollToSection() - glavna funkcija za prelazak između sekcija
   - Sekcije 1-3: VERTIKALNI scroll (scrollIntoView)
   - Sekcija 3→4: HORIZONTALNI scroll (transform: translateX)

4. ANIMACIJE (GSAP):
   - animateToSection1() - vraća model 1 u centar (velika veličina)
   - animateToSection2() - pomera model 1 levo (mala veličina + rotacija)
   - animateToSection3() - prikazuje model 3 (flaša) desno (uspravna)
   - animateToSection4() - zoom na model 3 (flaša u centru, uvećana)

5. ANIMATION LOOP:
   - animate() - renderuje scenu 60 puta u sekundi
   - Lebdenje efekat u sekciji 1 (sine/cosine waves)

6. RESPONSIVE:
   - Window resize listener - prilagođava kameru i renderer

PARAMETRI ZA RUČNO MENJANJE:

POZICIJA (position.set(x, y, z)):
  - x: levo (-) / desno (+)
  - y: dole (-) / gore (+)
  - z: daleko (+) / blizu (-)

ROTACIJA (rotation.x/y/z):
  - Math.PI = 180°
  - Math.PI / 2 = 90°
  - Math.PI * 2 = 360°

VELIČINA (scale.set(x, y, z)):
  - Veći broj = veći objekat
  - 0.007 = velika veličina (sekcija 1)
  - 0.002 = mala veličina (sekcija 2)
  - 0.01-0.015 = srednja veličina (sekcija 3-4)

FOV (Field of View):
  - 45° = širok ugao (normalno)
  - 35° = uži ugao (zoom)
  - Manji broj = veći zoom

KAMERA POZICIJA:
  - camera.position.z = 5 (daleko - početna)
  - camera.position.z = 2 (blizu - sekcija 4)

TRAJANJE ANIMACIJE:
  - duration: 1.5 (normalna animacija - 1.5 sekundi)
  - duration: 0.3 (brza animacija - 0.3 sekunde)

BOJE:
  - 0x8b1a1a = tamno crvena (modeli)
  - 0xffffff = bela (svetla)
  - 0xff0000 = crvena (point light)
*/
