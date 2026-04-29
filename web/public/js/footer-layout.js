// Footer layout: server flash messages & token injection for forms
(function(){
  document.addEventListener("DOMContentLoaded",function(){
    var d=document.getElementById('server-messages');
    var err=d?d.getAttribute('data-error'):null;
    var ok=d?d.getAttribute('data-success'):null;
    var url=new URLSearchParams(window.location.search);
    var isOk=url.get('success')==='true';
    if(typeof window.showModal==="function"){
      if(err&&err.trim()!=="")window.showModal("error",err);
      else if(ok&&ok.trim()!=="")window.showModal("success",ok);
      else if(isOk){window.showModal("success","¡Los cambios se han guardado correctamente!");window.history.replaceState({},document.title,window.location.pathname);}
    }
  });
  document.addEventListener("submit",async function(e){
    var form=e.target;
    if(!form.hasAttribute("data-requires-token"))return;
    e.preventDefault();
    var btn=form.querySelector('button[type="submit"]');
    var orig=btn?btn.innerHTML:null;
    try{
      if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm"></span> Seguridad...';}
      var m=await import("/js/auth.mjs");
      var token=await m.getFreshToken();
      var inp=form.querySelector('input[name="firebase_token"]');
      if(!inp){inp=document.createElement("input");inp.type="hidden";inp.name="firebase_token";form.prepend(inp);}
      inp.value=token;
      HTMLFormElement.prototype.submit.call(form);
    }catch(err){
      console.error("Error obteniendo token:",err);
      if(btn){btn.disabled=false;btn.innerHTML=orig;}
      if(typeof window.showModal==="function")window.showModal("error","Error de seguridad. Por favor, reidentifícate.");
      else alert("Error de seguridad. Por favor, reidentifícate.");
      setTimeout(function(){window.location.href="/login";},2000);
    }
  });
})();
