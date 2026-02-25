import "./style.css";
import "preline";

const etapiSeaded = {
  euroopa: { pealkiri: "Euroopa", kaust: "./assets/pildid/etapid/euroopa" },
  aafrika: { pealkiri: "Aafrika", kaust: "./assets/pildid/etapid/aafrika" },
  seilamine: { pealkiri: "Seilamine", kaust: "./assets/pildid/etapid/seilamine" },
  kariibid: { pealkiri: "Kariibid", kaust: "./assets/pildid/etapid/kariibid" },
  ameerika: { pealkiri: "Ameerika", kaust: "./assets/pildid/etapid/ameerika" },
  aasia: { pealkiri: "Aasia", kaust: "./assets/pildid/etapid/aasia" },
};

const etapiKaardid = Array.from(document.querySelectorAll("[data-gallery-stage]"));
const modal = document.querySelector("#etapi-galerii-modal");

if (etapiKaardid.length > 0 && modal) {
  const modalPanel = document.querySelector("#etapi-galerii-panel");
  const sulgeNupp = document.querySelector("#etapi-galerii-close");
  const pealkiriElement = document.querySelector("#etapi-galerii-title");
  const piltElement = document.querySelector("#etapi-galerii-image");
  const loendurElement = document.querySelector("#etapi-galerii-counter");
  const eelmineNupp = document.querySelector("#etapi-galerii-prev");
  const jargmineNupp = document.querySelector("#etapi-galerii-next");

  if (
    !modalPanel ||
    !sulgeNupp ||
    !pealkiriElement ||
    !piltElement ||
    !loendurElement ||
    !eelmineNupp ||
    !jargmineNupp
  ) {
    console.warn("Etapi galerii elemendid puuduvad DOM-ist.");
  } else {
    const galeriiPuhver = new Map();
    let aktiivneEtapp = null;
    let aktiivneIndeks = 0;
    let fallbackModalAvatud = false;

    const looUrlVariandid = (url) => {
      const variandid = [url];

      if (url.startsWith("./assets/")) {
        variandid.push(url.replace("./assets/", "./public/assets/"));
        variandid.push(url.replace("./assets/", "/assets/"));
        variandid.push(url.replace("./assets/", "/public/assets/"));
      }

      return Array.from(new Set(variandid));
    };

    const kontrolliKasPiltOnOlemas = (url) =>
      new Promise((resolve) => {
        const pilt = new Image();
        pilt.onload = () => resolve(true);
        pilt.onerror = () => resolve(false);
        pilt.src = url;
      });

    const leiaToimivUrl = async (url) => {
      for (const kandidaat of looUrlVariandid(url)) {
        if (await kontrolliKasPiltOnOlemas(kandidaat)) {
          return kandidaat;
        }
      }

      return null;
    };

    const naitaPilt = (url, alt) => {
      const variandid = looUrlVariandid(url);
      let indeks = 0;

      const prooviJargmist = () => {
        if (indeks >= variandid.length) {
          piltElement.removeAttribute("src");
          piltElement.onerror = null;
          piltElement.onload = null;
          return;
        }

        piltElement.src = variandid[indeks];
        indeks += 1;
      };

      piltElement.alt = alt;
      piltElement.onerror = prooviJargmist;
      piltElement.onload = () => {
        piltElement.onerror = null;
        piltElement.onload = null;
      };

      prooviJargmist();
    };

    const avaModal = () => {
      if (fallbackModalAvatud) {
        return;
      }

      modal.classList.remove("hidden", "pointer-events-none");
      modal.classList.add("pointer-events-auto");
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        modalPanel.classList.add("opacity-100", "mt-7");
        modalPanel.classList.remove("opacity-0", "mt-0");
      });

      fallbackModalAvatud = true;
    };

    const sulgeModal = () => {
      if (!fallbackModalAvatud) {
        return;
      }

      modalPanel.classList.remove("opacity-100", "mt-7");
      modalPanel.classList.add("opacity-0", "mt-0");

      window.setTimeout(() => {
        if (!fallbackModalAvatud) {
          return;
        }

        modal.classList.add("hidden", "pointer-events-none");
        modal.classList.remove("pointer-events-auto");
        document.body.style.overflow = "";
        fallbackModalAvatud = false;
      }, 180);
    };

    const laeEtapiPildid = async (etapp) => {
      if (galeriiPuhver.has(etapp)) {
        return galeriiPuhver.get(etapp);
      }

      const { kaust } = etapiSeaded[etapp];
      const pildid = [`${kaust}/1.jpg`];

      for (let i = 2; i <= 100; i += 1) {
        const kandidaadid = [`${kaust}/${i}.jpg`, `${kaust}/${i}.jpeg`, `${kaust}/${i}.png`];
        let leitud = null;

        for (const kandidaat of kandidaadid) {
          leitud = await leiaToimivUrl(kandidaat);
          if (leitud) {
            pildid.push(kandidaat);
            break;
          }
        }

        if (!leitud) {
          break;
        }
      }

      galeriiPuhver.set(etapp, pildid);
      return pildid;
    };

    const uuendaVaadet = () => {
      if (!aktiivneEtapp) {
        return;
      }

      const pildid = galeriiPuhver.get(aktiivneEtapp) ?? [];
      if (pildid.length === 0) {
        piltElement.removeAttribute("src");
        loendurElement.textContent = "Pilte ei leitud";
        eelmineNupp.disabled = true;
        jargmineNupp.disabled = true;
        return;
      }

      naitaPilt(
        pildid[aktiivneIndeks],
        `${etapiSeaded[aktiivneEtapp].pealkiri} etapi pilt ${aktiivneIndeks + 1}`,
      );

      loendurElement.textContent = `${aktiivneIndeks + 1} / ${pildid.length}`;

      const ainultUksPilt = pildid.length <= 1;
      eelmineNupp.disabled = ainultUksPilt;
      jargmineNupp.disabled = ainultUksPilt;
    };

    const seaLaadimiseOlek = (pealkiri) => {
      pealkiriElement.textContent = `${pealkiri} galerii`;
      loendurElement.textContent = "Laen pilte...";
      piltElement.removeAttribute("src");
      piltElement.alt = `${pealkiri} galerii`;
      eelmineNupp.disabled = true;
      jargmineNupp.disabled = true;
    };

    etapiKaardid.forEach((kaart) => {
      kaart.addEventListener("click", async () => {
        const etapp = kaart.dataset.galleryStage;
        if (!etapp || !etapiSeaded[etapp]) {
          return;
        }

        aktiivneEtapp = etapp;
        aktiivneIndeks = 0;

        seaLaadimiseOlek(etapiSeaded[etapp].pealkiri);
        naitaPilt(`${etapiSeaded[etapp].kaust}/1.jpg`, `${etapiSeaded[etapp].pealkiri} etapi pilt 1`);
        loendurElement.textContent = "1 / ...";

        avaModal();

        const pildid = await laeEtapiPildid(etapp);
        if (aktiivneEtapp !== etapp || pildid.length === 0) {
          return;
        }

        uuendaVaadet();
      });
    });

    eelmineNupp.addEventListener("click", () => {
      if (!aktiivneEtapp) {
        return;
      }

      const pildid = galeriiPuhver.get(aktiivneEtapp) ?? [];
      if (pildid.length <= 1) {
        return;
      }

      aktiivneIndeks = (aktiivneIndeks - 1 + pildid.length) % pildid.length;
      uuendaVaadet();
    });

    jargmineNupp.addEventListener("click", () => {
      if (!aktiivneEtapp) {
        return;
      }

      const pildid = galeriiPuhver.get(aktiivneEtapp) ?? [];
      if (pildid.length <= 1) {
        return;
      }

      aktiivneIndeks = (aktiivneIndeks + 1) % pildid.length;
      uuendaVaadet();
    });

    sulgeNupp.addEventListener("click", sulgeModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        sulgeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        sulgeModal();
        return;
      }

      if (modal.classList.contains("hidden")) {
        return;
      }

      if (event.key === "ArrowLeft") {
        eelmineNupp.click();
      }

      if (event.key === "ArrowRight") {
        jargmineNupp.click();
      }
    });
  }
}
