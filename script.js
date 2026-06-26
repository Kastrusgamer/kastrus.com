
const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{const href=a.getAttribute('href');if(href.length>1){e.preventDefault();document.querySelector(href)?.scrollIntoView({behavior:'smooth',block:'start'});}})});
