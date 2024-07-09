'use client';

import Image from 'next/image';
import ResumeAnalyzerApp from './components/ResumeAnalyzerApp';
import styles from './styles/Home.module.css';


export default function Home() {
  return (
    <main className={styles.App}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className="{styles.centeredContent}">
            <div className="flex space-x-3 justify-center items-center pb-8 pt-6">
            <Image
              alt="header text"
              src="/Logo.png"
              className="sm:w-20 sm:h-20 w-8 h-8"
              width={42}
              height={42}
            />
            <h1 className="sm:text-4xl text-2xl font-bold ml-2 tracking-tight">
              valeurDeMonCV
            </h1>
            </div>
            <ResumeAnalyzerApp />
          </div>
        </div>
        <p className={styles.footer}>Built by <a href='https://github.com/CodeOne45' target='_blank'>Aman KUMAR</a></p>
      </div>
    </main>
  )
}