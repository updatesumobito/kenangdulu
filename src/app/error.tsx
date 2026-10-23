'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="wrap section"><h1>Ada gangguan sementara.</h1><p>Data yang berhasil dikirim tetap tersimpan. Silakan coba kembali.</p><button onClick={reset}>Coba kembali</button></main>}
