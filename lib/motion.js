/**
 * Token motion. Sama prinsipnya kayak token warna: jangan taro angka easing
 * acak di komponen. Kalau tiap komponen punya durasi sendiri, geraknya kerasa
 * kayak lima orang yang gak saling ngomong.
 */

/**
 * Kurva easing.
 *
 * `out` itu ease-out-expo: ngebut di awal, mendarat halus. Ini yang bikin UI
 * kerasa RESPONSIF — gerakan langsung mulai pas diklik, bukan ngambang dulu.
 * Jangan pakai easing linear atau ease-in buat elemen yang MASUK; itu bikin
 * kerasa lag padahal durasinya sama.
 */
export const EASE = {
    out: [0.16, 1, 0.3, 1],
    inOut: [0.83, 0, 0.17, 1],
    in: [0.7, 0, 0.84, 0],
};

/**
 * Durasi. Di bawah 150ms mata gak nangkep animasinya (kerasa "nyeplak"),
 * di atas 500ms mulai kerasa lambat. Sweet spot UI ada di 200-350ms.
 */
export const DURATION = {
    fast: 0.18,
    base: 0.3,
    slow: 0.48,
};

/** Spring buat interaksi langsung (hover, tap, drag) — kerasa fisik, bukan skrip. */
export const SPRING = {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 0.8,
};

/** Spring lebih lembut buat layout shift dan elemen gede. */
export const SPRING_SOFT = {
    type: "spring",
    stiffness: 220,
    damping: 28,
    mass: 1,
};

/**
 * Jeda antar anak di list.
 * 40ms itu titik di mana urutannya kebaca sebagai "berdatangan" tanpa bikin
 * item terakhir nunggu kelamaan. Di list 20 baris, 100ms udah nyiksa.
 */
export const STAGGER = 0.04;

/** Transition standar buat elemen yang masuk. */
export const TRANSITION_IN = {
    duration: DURATION.base,
    ease: EASE.out,
};
