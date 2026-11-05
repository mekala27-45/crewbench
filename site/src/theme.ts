export function installTheme(){
 const button=document.createElement('button');button.id='theme-toggle';button.className='theme-toggle';button.type='button';button.setAttribute('aria-label','Dark theme');
 let saved:string|null=null;try{saved=localStorage.getItem('crewbench-theme');}catch{}
 let dark=saved?saved==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
 const apply=()=>{document.documentElement.dataset.theme=dark?'dark':'light';button.setAttribute('aria-pressed',String(dark));button.textContent=dark?'Light theme':'Dark theme';};
 button.onclick=()=>{dark=!dark;apply();try{localStorage.setItem('crewbench-theme',dark?'dark':'light');}catch{}};apply();document.querySelector('header')!.append(button);
}
