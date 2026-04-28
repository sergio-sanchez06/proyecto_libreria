function changeLanguage(req, res) {
  const newLang = req.query.lng;
  const returnTo = req.query.returnTo; // Recuperamos la URL que enviamos desde el EJS

  console.log("El nuevo idioma es: ", newLang);

  // Cambiamos el idioma en la sesión/cookie
  req.i18n.changeLanguage(newLang, (err) => {
    if (err) return res.status(500).send("Error cambiando el idioma");

    // Redirigimos a la página anterior o al home si no hay referer
    const backURL = returnTo || req.header("Referer") || "/";
    res.redirect(backURL);
  });
}

export default {
  changeLanguage,
};
