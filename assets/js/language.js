
const translations = {
  "Home": "முகப்பு", 
  "About Us": "எங்களை பற்றி", 
  "Our Services": "எங்கள் சேவைகள்", 
  "Contact Us": "தொடர்புக்கு", 
  "Login": "உள்நுழை", 
  "We the Weaver Leaders": "நாம் நெசவாளர் தலைவர்கள்",
  "Explore Our Services": "எங்கள் சேவைகளை அறிய", 
  "Our Vision": "எங்கள் நோக்கம்", 
  "Our Mission": "எங்கள் பணி", 
  "What We Do": "எங்கள் சேவைகள்",
  "Weaver Empowerment": "நெசவாளர் மேம்பாடு", 
  "Skill Development": "திறன் மேம்பாடு", 
  "Handloom Promotion": "கைத்தறி ஊக்குவிப்பு", 
  "Market Access": "சந்தை அணுகல்", 
  "Community Collaboration": "சமூக ஒத்துழைப்பு", 
  "Advocacy & Recognition": "ஆதரவு மற்றும் அங்கீகாரம்",
  "Join our Community": "எங்கள் சமூகத்தில் இணையுங்கள்", 
  "Register With Us": "எங்களுடன் பதிவு செய்யுங்கள்", 
  "Enter Your Name": "உங்கள் பெயரை உள்ளிடவும்", 
  "Enter Your Mobile": "மொபைல் எண்ணை உள்ளிடவும்",
  "Submit": "சமர்ப்பிக்கவும்", 
  "Gallery": "படங்கள்", 
  "Company": "நிறுவனம்", 
  "Follow Us": "எங்களை பின்தொடருங்கள்",
  "Let Us Cherish Weaving,": "நெசவைக் போற்றுவோம்,", 
  "Let Us foster Weaving": "நெசவை வளர்ப்போம்",
  "Committed to empowering weaving communities, preserving traditional craftsmanship, and creating sustainable opportunities that inspire growth, innovation, and cultural pride." : "நெசவுச் சமூகங்களை வலுப்படுத்துவதிலும், பாரம்பரியக் கைவினைத் திறனைப் பாதுகாப்பதிலும், வளர்ச்சி, புத்தாக்கம் மற்றும் கலாச்சாரப் பெருமிதத்தைத் தூண்டும் நிலையான வாய்ப்புகளை உருவாக்குவதிலும் அர்ப்பணிப்புடன் செயல்படுதல்.",
  "is a community-driven platform committed to preserving and promoting the rich heritage of weaving and textile craftsmanship" : "என்பது, நெசவு மற்றும் ஜவுளிக் கைவினைத்திறனின் செழுமையான பாரம்பரியத்தைப் பாதுகாப்பதற்கும் மேம்படுத்துவதற்கும் அர்ப்பணிக்கப்பட்ட, சமூகத்தால் இயக்கப்படும் ஒரு தளமாகும்",
  "Through collaboration, innovation, and knowledge sharing, we connect traditional weaving practices with modern opportunities, helping artisans grow through sustainable methods, new skills, and wider market access.": "ஒத்துழைப்பு, புதுமை மற்றும் அறிவுப் பகிர்வு ஆகியவற்றின் மூலம், நாங்கள் பாரம்பரிய நெசவு முறைகளை நவீன வாய்ப்புகளுடன் இணைத்து, கைவினைஞர்கள் நிலையான வழிமுறைகள், புதிய திறன்கள் மற்றும் பரந்த சந்தை அணுகல் ஆகியவற்றின் மூலம் வளர்ச்சி அடைய உதவுகிறோம்.",
  "We envision a future where weaving is celebrated as both a treasured cultural heritage and a sustainable source of livelihood": "நெசவுத் தொழிலை ஒரு போற்றத்தக்க கலாச்சாரப் பாரம்பரியமாகவும், அதே வேளையில் நிலையான வாழ்வாதாரமாகவும் கொண்டாடும் ஒரு எதிர்காலத்தை நாங்கள் முன்னிறுத்துகிறோம்.",
  "collaboration" : "கூட்டுப்பணி",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
  "" : "",
};

function applyLang(lang){
 localStorage.setItem('lang',lang);
 document.getElementById('engSwitch')&&(document.getElementById('engSwitch').checked=lang==='en');
 document.getElementById('tamSwitch')&&(document.getElementById('tamSwitch').checked=lang==='ta');
 document.querySelectorAll('body *').forEach(el=>{
   if(el.children.length===0){
     const txt = el.textContent
    .replace(/\s+/g, ' ')
    .trim();
     if(lang==='ta' && translations[txt]) el.textContent=translations[txt];
     else if(lang==='en' && el.dataset.en) el.textContent=el.dataset.en;
     if(!el.dataset.en) el.dataset.en=txt;
   }
   if(el.placeholder){
      if(!el.dataset.enph) el.dataset.enph=el.placeholder;
      if(lang==='ta' && translations[el.placeholder]) el.placeholder=translations[el.placeholder];
      if(lang==='en') el.placeholder=el.dataset.enph;
   }
 });
}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('body *').forEach(el=>{if(el.children.length===0&&!el.dataset.en) el.dataset.en=el.textContent.trim();});
 document.getElementById('engSwitch')?.addEventListener('change',()=>applyLang('en'));
 document.getElementById('tamSwitch')?.addEventListener('change',()=>applyLang('ta'));
 applyLang(localStorage.getItem('lang')||'en');
});
