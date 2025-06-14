window.mgAuth = { email: null, time: null };

(async () => {
  function setCookie(name, value, ttl) {
    const d = new Date();
    d.setTime(d.getTime() + ttl * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;Secure;SameSite=Lax`;
  }

  function getCookie(name) {
    const m = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
    return m ? decodeURIComponent(m[2]) : null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const verify = async tok => {
    try {
      const res = await fetch("https://mg-auth.onrender.com/verify_token?token=" + tok);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();

      if (json.valid && json.email && json.exp) {
        const ttl = json.exp - Math.floor(Date.now() / 1000);
        setCookie("mg_email", json.email, ttl);
        setCookie("mg_exp", json.exp, ttl);
        mgAuth.email = json.email;
        mgAuth.time = json.exp;

        window.dispatchEvent(new Event("mgAuthReady")); // <-- important
        return;
      }
    } catch (e) {
      console.warn("MG Auth: Token verification failed", e);
    }
    window.dispatchEvent(new Event("mgAuthReady")); // even on failure
  };

  if (token) {
    await verify(token);
  } else {
    const email = getCookie("mg_email");
    const expStr = getCookie("mg_exp");
    const exp = parseInt(expStr);
    if (email && exp && exp > Math.floor(Date.now() / 1000)) {
      mgAuth.email = email;
      mgAuth.time = exp;
    }
    window.dispatchEvent(new Event("mgAuthReady"));
  }
})();
