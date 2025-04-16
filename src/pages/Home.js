import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Modal,
  Button,
  Nav,
  Offcanvas,
  Tab,
  Tabs,
} from "react-bootstrap";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaUser,
  FaUserMd,
  FaHospital,
  FaPhone,
  FaBars,
  FaTimes,
  FaMapMarkerAlt,
  FaChevronDown,
  FaWhatsapp,
  FaEnvelope,
  FaAmbulance,
  FaHeartbeat,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaQuoteLeft,
  FaQuoteRight,
  FaChevronRight,
  FaChevronLeft,
  FaCheck,
  FaStethoscope,
  FaLungs,
  FaChild,
  FaAppleAlt,
  FaVial,
  FaEye,
  FaFemale,
  FaBrain,
  FaFlask,
  FaCode,
  FaLaptopCode,
  FaGlobe,
  FaGlasses,
  FaLowVision,
  FaSearch,
} from "react-icons/fa";
import emailjs from "@emailjs/browser";
import Quick from "./Quick.js";

import { motion, AnimatePresence } from "framer-motion";
import monImage1 from "./Assets/4530b381-f925-454c-bd19-cc468d625013.jpeg";
import monImage2 from "./Assets/WhatsApp Image 2025-03-05 at 16.33.21 (1).jpeg";
import monImage3 from "./Assets/WhatsApp Image 2025-03-05 at 16.33.21 (2).jpeg";
import monImage4 from "./Assets/WhatsApp Image 2025-03-05 at 16.33.21 (3).jpeg";
import monImage5 from "./Assets/WhatsApp Image 2025-03-05 at 16.33.21 (5).jpeg";

//backgroundImages
import monImage6 from "./Assets/occilaire.jpeg";
import monImage7 from "./Assets/20f0aa2c-576c-4f7f-94c1-5d12e8f122c2.jpeg";
import monImage8 from "./Assets/96eb075b-2c75-403d-8293-dc8a061b9cf2.jpeg";
import monImage9 from "./Assets/854e05e1-155e-4451-9d3f-2209ccee4bfc.jpeg";
import monImage10 from "./Assets/4530b381-f925-454c-bd19-cc468d625013.jpeg";
import monImage11 from "./Assets/5371ce22-af80-47c4-9bc1-2257dfe711db.jpeg";

const Home = () => {
  const structureId = "VOTRE_ID_STRUCTURE"; // Remplacer par l'ID de votre structure

  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const testimonialsRef = useRef(null);
  const contactRef = useRef(null);
  const [activeDevTeamMember, setActiveDevTeamMember] = useState(0);

  // Liste complète des prestations médicales spécifiques à l'ophtalmologie
  const medicalServices = [
    {
      category: "consultation",
      name: "chirurgien Ophtalmologique",
      doctors: ["Dr Gabriel K. MENDY "],
      icon: <FaEye />,
      description: "Examen complet de la vision et de la santé oculaire",
      color: "#3498db",
    },
    {
      category: "cataracte",
      name: "Chirurgie de la Cataracte",
      doctors: ["Dr."],
      icon: <FaUserMd />,
      description:
        "Intervention pour remplacer le cristallin opacifié par une lentille artificielle",
      color: "#2980b9",
    },
    {
      category: "glaucome",
      name: "Traitement du Glaucome",
      doctors: ["Dr. "],
      icon: <FaEye />,
      description: "Suivi et traitement de la pression intraoculaire élevée",
      color: "#1abc9c",
    },
    {
      category: "retine",
      name: "Chirurgie Vitréo-Rétinienne",
      doctors: ["Dr."],
      icon: <FaUserMd />,
      description: "Interventions sur la rétine et le corps vitré",
      color: "#16a085",
    },
    {
      category: "pediatrie",
      name: "Ophtalmologie Pédiatrique",
      doctors: ["Dr. "],
      icon: <FaChild />,
      description: "Soins oculaires spécialisés pour les enfants",
      color: "#27ae60",
    },
    {
      category: "refraction",
      name: "Troubles de la Réfraction",
      doctors: ["Dr. "],
      icon: <FaGlasses />,
      description:
        "Correction des problèmes de vision (myopie, hypermétropie, astigmatisme)",
      color: "#f39c12",
    },
    {
      category: "cornee",
      name: "Chirurgie de la Cornée",
      doctors: ["Dr. "],
      icon: <FaUserMd />,
      description: "Traitements et greffes de la cornée",
      color: "#e74c3c",
    },
    {
      category: "strabisme",
      name: "Traitement du Strabisme",
      doctors: ["Dr. "],
      icon: <FaEye />,
      description: "Correction du désalignement des yeux",
      color: "#9b59b6",
    },
    {
      category: "laser",
      name: "Chirurgie Réfractive au Laser",
      doctors: ["Dr. "],
      icon: <FaLowVision />,
      description: "Correction de la vision par laser (LASIK, PRK)",
      color: "#e67e22",
    },
    {
      category: "diabete",
      name: "Rétinopathie Diabétique",
      doctors: ["Dr."],
      icon: <FaVial />,
      description: "Suivi et traitement des complications oculaires du diabète",
      color: "#c0392b",
    },
    {
      category: "dmla",
      name: "DMLA",
      doctors: ["Dr."],
      icon: <FaEye />,
      description: "Traitement de la dégénérescence maculaire liée à l'âge",
      color: "#8e44ad",
    },
    {
      category: "seche",
      name: "Syndrome de l'Œil Sec",
      doctors: ["Dr. "],
      icon: <FaEye />,
      description: "Diagnostic et traitement de la sécheresse oculaire",
      color: "#2c3e50",
    },
    {
      category: "oculoplastie",
      name: "Chirurgie Oculoplastique",
      doctors: ["Dr."],
      icon: <FaUserMd />,
      description: "Interventions sur les paupières et les voies lacrymales",
      color: "#d35400",
    },
    {
      category: "contactologie",
      name: "Contactologie",
      doctors: ["Dr. "],
      icon: <FaSearch />,
      description: "Adaptation et suivi des lentilles de contact",
      color: "#7f8c8d",
    },
    {
      category: "examen",
      name: "Examens Complémentaires",
      doctors: ["Dr. "],
      icon: <FaSearch />,
      description: "OCT, angiographie, champ visuel, échographie oculaire",
      color: "#34495e",
    },
  ];

  const [activeServiceSlide, setActiveServiceSlide] = useState(0);
  const servicesCarouselRef = useRef(null);
  const maxServiceSlides = Math.ceil(medicalServices.length / 3) - 1; // Changé de 6 à 3

  // Modifiez votre useEffect pour le carrousel automatique des services
  useEffect(() => {
    const container = servicesCarouselRef.current;
    if (!container) return;

    let isUserInteracting = false;
    let autoSlideInterval;

    // Fonction pour passer à la slide suivante avec une meilleure gestion
    const nextSlide = () => {
      if (isUserInteracting) return;

      setActiveServiceSlide((prevIndex) => {
        const nextIndex = prevIndex >= maxServiceSlides ? 0 : prevIndex + 1;

        // Utiliser requestAnimationFrame pour un défilement plus fluide
        requestAnimationFrame(() => {
          if (container) {
            container.style.scrollBehavior = "smooth";
            container.scrollTo({
              left: container.clientWidth * nextIndex,
              behavior: "smooth",
            });
          }
        });

        return nextIndex;
      });
    };

    // Démarrer le défilement automatique
    const startAutoSlide = () => {
      clearInterval(autoSlideInterval);
      autoSlideInterval = setInterval(nextSlide, 8000);
    };

    // Détecter l'interaction utilisateur
    const handleInteractionStart = () => {
      isUserInteracting = true;
      clearInterval(autoSlideInterval);
    };

    const handleInteractionEnd = () => {
      isUserInteracting = false;
      startAutoSlide();
    };

    // Améliorer la détection du défilement
    const handleScroll = () => {
      if (!container || isUserInteracting) return;

      const slideWidth = container.clientWidth;
      const scrollPosition = container.scrollLeft;

      // Calculer l'index actif avec plus de précision
      const activeIndex = Math.round(scrollPosition / slideWidth);

      if (
        activeIndex !== activeServiceSlide &&
        activeIndex >= 0 &&
        activeIndex <= maxServiceSlides
      ) {
        setActiveServiceSlide(activeIndex);
      }
    };

    // Ajouter les écouteurs d'événements
    container.addEventListener("mousedown", handleInteractionStart);
    container.addEventListener("touchstart", handleInteractionStart);
    container.addEventListener("mouseup", handleInteractionEnd);
    container.addEventListener("touchend", handleInteractionEnd);
    container.addEventListener("scroll", handleScroll);

    // Démarrer le défilement automatique
    startAutoSlide();

    // Nettoyer les écouteurs d'événements lors du démontage
    return () => {
      clearInterval(autoSlideInterval);

      if (container) {
        container.removeEventListener("mousedown", handleInteractionStart);
        container.removeEventListener("touchstart", handleInteractionStart);
        container.removeEventListener("mouseup", handleInteractionEnd);
        container.removeEventListener("touchend", handleInteractionEnd);
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [activeServiceSlide, maxServiceSlides]);

  // Fonction pour naviguer manuellement avec une meilleure gestion
  const navigateServiceSlide = (index) => {
    if (!servicesCarouselRef.current) return;

    requestAnimationFrame(() => {
      servicesCarouselRef.current.style.scrollBehavior = "smooth";
      servicesCarouselRef.current.scrollTo({
        left: servicesCarouselRef.current.clientWidth * index,
        behavior: "smooth",
      });

      setActiveServiceSlide(index);
    });
  };

  const backgroundImages = [
    "https://i.pinimg.com/736x/a0/4e/8a/a04e8ab43cd1caba9b74ea45e01c4d18.jpg",
    "https://i.pinimg.com/474x/9c/44/5c/9c445c9cf5280a0ede97ff0864ef5a37.jpg",
    "https://i.pinimg.com/736x/a5/41/9f/a5419f4767a3a4c3eeda811a5ce011d3.jpg" ,
    monImage6,
  ];

  const devTeam = [
    {
      name: "SAMD",
      role: "Transformer l'expérience des soins oculaires grâce au numérique",
      image: monImage1, // Utilisez une de vos images existantes ou ajoutez-en une nouvelle
      description:
        "Tel: +221 77 706 31 40 / Email : senassistancemedicaledigitale@gmail.com",
      url: "https://sen-amd.vercel.app/",
    },
    {
      name: "SAMD",
      role: "Optimiser l'accessibilité aux soins ophtalmologiques grâce au numérique",
      image: monImage2, // Utilisez une de vos images existantes ou ajoutez-en une nouvelle
      description:
        "Tel: +221 77 706 31 40 / Email : senassistancemedicaledigitale@gmail.com",
      url: "https://sen-amd.vercel.app/",
    },
    {
      name: "SAMD",
      role: "Redonner la vue aux patients grâce à des technologies de pointe",
      image: monImage3, // Utilisez une de vos images existantes ou ajoutez-en une nouvelle
      description:
        "Tel: +221 77 706 31 40 / Email : senassistancemedicaledigitale@gmail.com",
      url: "https://sen-amd.vercel.app/",
    },
  ];

  useEffect(() => {
    emailjs.init("MCVx8ryDmfsqT_R_P");
  }, []);

  // État pour gérer le statut du formulaire
  const [formStatus, setFormStatus] = useState({
    submitting: false,
    submitted: false,
    info: { error: false, msg: null },
  });

  // Référence pour le formulaire
  const form = useRef();

  // Fonction pour envoyer l'email
  const sendEmail = (e) => {
    e.preventDefault();

    setFormStatus({
      submitting: true,
      submitted: false,
      info: { error: false, msg: "Envoi en cours..." },
    });

    // Remplacez ces valeurs par vos identifiants EmailJS
    const serviceId = "service_tgx6ffp";
    const templateId = "template_fjjoc53";
    const publicKey = "MCVx8ryDmfsqT_R_P";

    emailjs
      .sendForm(serviceId, templateId, form.current, publicKey)
      .then((result) => {
        console.log("Email envoyé avec succès!", result.text);
        form.current.reset();
        setFormStatus({
          submitting: false,
          submitted: true,
          info: { error: false, msg: "Message envoyé avec succès!" },
        });

        // Afficher un message de succès pendant 3 secondes
        setTimeout(() => {
          setFormStatus({
            submitting: false,
            submitted: false,
            info: { error: false, msg: null },
          });
        }, 3000);
      })
      .catch((error) => {
        console.error("Erreur lors de l'envoi de l'email:", error.text);
        setFormStatus({
          submitting: false,
          submitted: false,
          info: {
            error: true,
            msg: "Une erreur est survenue lors de l'envoi du message.",
          },
        });
      });
  };

  // Services mis en avant sur la page d'accueil
  const featuredServices = [
    {
      name: "Consultation Ophtalmologique",
      icon: <FaEye />,
      description: "Examen complet de la vision et de la santé oculaire",
      color: "#3498db",
    },
    {
      name: "Chirurgie de la Cataracte",
      icon: <FaUserMd />,
      description: "Intervention pour remplacer le cristallin opacifié",
      color: "#2980b9",
    },
    {
      name: "Traitement du Glaucome",
      icon: <FaEye />,
      description: "Suivi et traitement de la pression intraoculaire",
      color: "#1abc9c",
    },
    {
      name: "Chirurgie Réfractive",
      icon: <FaLowVision />,
      description: "Correction de la vision par laser",
      color: "#e67e22",
    },
    {
      name: "Ophtalmologie Pédiatrique",
      icon: <FaChild />,
      description: "Soins oculaires spécialisés pour enfants",
      color: "#27ae60",
    },
    {
      name: "Examens Spécialisés",
      icon: <FaSearch />,
      description: "OCT, angiographie, champ visuel, échographie",
      color: "#34495e",
    },
  ];

  const features = [
    {
      title: "Équipe spécialisée",
      icon: <FaUserMd />,
      description: "Ophtalmologues qualifiés dans diverses sous-spécialités",
    },
    {
      title: "Rendez-vous faciles",
      icon: <FaCalendarCheck />,
      description: "Système de prise de rendez-vous simple et efficace",
    },
    {
      title: "Équipement moderne",
      icon: <FaHospital />,
      description:
        "Technologies de pointe pour des diagnostics et traitements optimaux",
    },
  ];

  const testimonials = [
    {
      name: "Amadou Diallo",
      role: "Patient opéré de la cataracte",
      text: "Grâce au Cabinet d'Ophtalmologie, j'ai retrouvé une vision parfaite après mon opération de la cataracte. L'équipe est exceptionnelle!",
      avatar: {monImage6},
    },
    {
      name: "Fatou Ndiaye",
      role: "Mère d'un patient",
      text: "Mon fils a été pris en charge pour son strabisme avec beaucoup de professionnalisme. Le résultat est impressionnant et il a retrouvé confiance en lui.",
      avatar: {monImage6},
    },
  ];

  const advantages = [
    {
      title: "Expertise médicale",
      description:
        "Une équipe d'ophtalmologues spécialisés dans différents domaines de la santé oculaire",
      icon: <FaUserMd />,
    },
    {
      title: "Équipement de pointe",
      description:
        "Technologies avancées pour des diagnostics précis et des traitements efficaces",
      icon: <FaHospital />,
    },
    {
      title: "Approche personnalisée",
      description: "Soins adaptés aux besoins spécifiques de chaque patient",
      icon: <FaEye />,
    },
    {
      title: "Suivi continu",
      description:
        "Accompagnement complet tout au long de votre parcours de soins oculaires",
      icon: <FaShieldAlt />,
    },
  ];

  // Catégories pour filtrer les services
  const serviceCategories = [
    { id: "all", name: "Tous les services" },
    { id: "diagnostic", name: "Diagnostics" },
    { id: "chirurgie", name: "Chirurgies" },
    { id: "traitement", name: "Traitements" },
    { id: "pediatrie", name: "Pédiatrie" },
  ];

  useEffect(() => {
    setIsLoaded(true);

    const devTeamInterval = setInterval(() => {
      setActiveDevTeamMember((prev) =>
        prev === devTeam.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    const handleScroll = () => {
      setScrollPosition(window.scrollY);

      // Détection de la section active pour le menu
      const scrollPos = window.scrollY + 100;

      if (
        heroRef.current &&
        scrollPos < heroRef.current.offsetTop + heroRef.current.offsetHeight
      ) {
        setActiveSection("hero");
      } else if (
        servicesRef.current &&
        scrollPos <
          servicesRef.current.offsetTop + servicesRef.current.offsetHeight
      ) {
        setActiveSection("services");
      } else if (
        aboutRef.current &&
        scrollPos < aboutRef.current.offsetTop + aboutRef.current.offsetHeight
      ) {
        setActiveSection("about");
      } else if (
        testimonialsRef.current &&
        scrollPos <
          testimonialsRef.current.offsetTop +
            testimonialsRef.current.offsetHeight
      ) {
        setActiveSection("testimonials");
      } else if (contactRef.current) {
        setActiveSection("contact");
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(devTeamInterval);
      clearInterval(interval);
      clearInterval(testimonialInterval);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (swipeDistance > minSwipeDistance) {
      // Swipe left - next image
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe right - previous image
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? backgroundImages.length - 1 : prevIndex - 1
      );
    }
  };

  const toggleSection = (section, e) => {
    // Empêcher la propagation de l'événement
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveSection(activeSection === section ? null : section);
  };

  // Navigation douce vers les sections
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const yOffset = -80; // Ajustement pour tenir compte du header fixe
      const y =
        section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    if (isMobile) {
      setShowMenu(false);
    }
  };

  // Filtrer les services selon l'onglet actif
  const getFilteredServices = () => {
    if (activeTab === "all") {
      return medicalServices;
    }

    // Logique de filtrage selon les catégories
    switch (activeTab) {
      case "diagnostic":
        return medicalServices.filter((service) =>
          ["consultation", "examen"].includes(service.category)
        );
      case "chirurgie":
        return medicalServices.filter((service) =>
          ["cataracte", "retine", "cornee", "laser", "oculoplastie"].includes(
            service.category
          )
        );
      case "traitement":
        return medicalServices.filter((service) =>
          ["glaucome", "strabisme", "diabete", "dmla", "seche"].includes(
            service.category
          )
        );
      case "pediatrie":
        return medicalServices.filter((service) =>
          ["pediatrie"].includes(service.category)
        );
      default:
        return medicalServices;
    }
  };

  return (
    <div className="home-page">
      {/* Header moderne avec effet de transparence */}
      <header
        className={`site-header ${scrollPosition > 30 ? "scrolled" : ""}`}
      >
        <div className="co p-2">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-icon" onClick={() => navigate("/auth")}>
                <FaEye size={30} />
              </div>
              <div className="logo-text">
                <span className="logo-name">CABINET D'OPHTALMOLOGIE </span>
                <span className="logo-tagline">Dr MAR NDIAYE</span>
              </div>
            </div>

            {!isMobile && (
              <nav className="main-nav">
                <ul>
                  <li className={activeSection === "hero" ? "active" : ""}>
                    <a onClick={() => scrollToSection("hero")}>Accueil</a>
                  </li>
                  <li className={activeSection === "services" ? "active" : ""}>
                    <a onClick={() => scrollToSection("services")}>Services</a>
                  </li>
                  <li className={activeSection === "about" ? "active" : ""}>
                    <a onClick={() => scrollToSection("about")}>À propos</a>
                  </li>
                  <li
                    className={activeSection === "testimonials" ? "active" : ""}
                  >
                    <a onClick={() => scrollToSection("testimonials")}>
                      Témoignages
                    </a>
                  </li>
                  <li className={activeSection === "contact" ? "active" : ""}>
                    <a onClick={() => scrollToSection("contact")}>Contact</a>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Section Hero avec slider moderne */}
      <section id="hero" ref={heroRef} className="hero-section">
        <div
          className="hero-slider"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`hero-slide ${
                currentImageIndex === index ? "active" : ""
              }`}
              style={{ backgroundImage: `url(${image})` }}
            >
              <div className="hero-overlay"></div>
            </div>
          ))}

          <div className="container">
            <div className="hero-content">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="hero-text"
              >
                <p className="fw-bold fs-1 text-white  ">
                  {" "}
                  CABINET D'OPHTALMOLOGIE
                </p>
                <h2>
                  <span className="text-info fw-bolder">
                    CHIRURGIE OCULAIRE
                  </span>

                  <br />
                  <smnall className="fs-4">Dr MAR NDIAYE</smnall>
                </h2>

                <div className="hero-features">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="feature-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.2, duration: 0.5 }}
                    >
                      <div className="feature-icon">{feature.icon}</div>
                      <div className="feature-content">
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="hero-actions">
                  <Button
                    className="btn-primary"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    Prendre rendez-vous <FaArrowRight />
                  </Button>
                  <Button
                    className="btn-outline"
                    onClick={() => scrollToSection("services")}
                  >
                    Nos services <FaArrowRight />
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="hero-card d-none d-md-block"
                whileHover={{
                  y: -5,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
              >
                <motion.div
                  className="card-header"
                  initial={{
                    background: "linear-gradient(135deg, #0070f3, #0050d0)",
                  }}
                  whileHover={{
                    background: "linear-gradient(135deg, #0050d0, #0070f3)",
                  }}
                >
                  <motion.div
                    className="header-icon-container"
                    animate={{
                      rotate: [0, 10, -10, 10, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatDelay: 5,
                      duration: 1,
                    }}
                  >
                    <FaClock className="header-icon" />
                  </motion.div>
                  <h3>Horaires d'ouverture</h3>
                </motion.div>

                <AnimatePresence>
                  <motion.div className="card-body">
                    <motion.div className="schedule-container">
                      <motion.div
                        className="schedule-section"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="schedule-item">
                          <span className="day-label">Lundi - Dimanche</span>
                          <motion.span
                            className="time-label"
                            whileHover={{
                              scale: 1.05,
                              backgroundColor: "rgba(0, 112, 243, 0.2)",
                            }}
                          >
                            08H00 — 16H00
                          </motion.span>
                        </div>
                      </motion.div>

                      <motion.div
                        className="sport-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        <motion.div
                          className="section-title"
                          whileHover={{ x: 5 }}
                        >
                          <motion.span
                            animate={{
                              color: ["#0070f3", "#00a2ff", "#0070f3"],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 3,
                            }}
                          >
                            Consultations spécialisées
                          </motion.span>
                        </motion.div>

                        <motion.div
                          className="activity-grid"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                        >
                          <motion.div
                            className="activity-item"
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: "rgba(0, 112, 243, 0.05)",
                            }}
                          >
                            <div className="activity-name">CATARACTE</div>
                            <div className="activity-details">
                              <div className="activity-days">Lun-Mar-Jeu</div>
                              <div className="activity-times">
                                <span>9:00-12:00</span>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            className="activity-item"
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: "rgba(0, 112, 243, 0.05)",
                            }}
                          >
                            <div className="activity-name">GLAUCOME</div>
                            <div className="activity-details">
                              <div className="activity-days">Mar-Ven</div>
                              <div className="activity-times">
                                <span>14:00-16:00</span>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            className="activity-item"
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: "rgba(0, 112, 243, 0.05)",
                            }}
                          >
                            <div className="activity-name">PÉDIATRIE</div>
                            <div className="activity-details">
                              <div className="activity-days">Mer</div>
                              <div className="activity-times">
                                <span>14:00-17:00</span>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            className="activity-item"
                            whileHover={{
                              scale: 1.02,
                              backgroundColor: "rgba(0, 112, 243, 0.05)",
                            }}
                          >
                            <div className="activity-name">RÉTINE</div>
                            <div className="activity-details">
                              <div className="activity-days">Jeu-Ven</div>
                              <div className="activity-times">
                                <span>9:00-12:00</span>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      className="emergency-box"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <motion.div
                        className="emergency-icon"
                        animate={{
                          rotate: [0, 15, -15, 15, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatDelay: 3,
                          duration: 0.5,
                        }}
                      >
                        <FaPhone />
                      </motion.div>
                      <div className="emergency-info">
                        <span>Appelez-nous</span>
                        <motion.strong
                          animate={{
                            color: ["#0070f3", "#0050d0", "#0070f3"],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                          }}
                        >
                          +221-338242424
                        </motion.strong>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Équipe de développement */}
      <section className="dev-team-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Notre équipe technique</span>
            <h2>L'équipe derrière la plateforme</h2>
          </div>

          <div className="dev-team-carousel">
            <div className="dev-team-wrapper">
              {devTeam.map((member, index) => (
                <motion.div
                  key={index}
                  className={`dev-team-card ${
                    activeDevTeamMember === index ? "active" : ""
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeDevTeamMember === index ? 1 : 0,
                    display: activeDevTeamMember === index ? "block" : "none",
                  }}
                  transition={{ duration: 0.5 }}
                  onClick={() => window.open(member.url, "_blank")}
                >
                  <div className="dev-team-image">
                    <img src={member.image} alt={member.name} />
                    <div className="dev-team-overlay">
                      <FaGlobe />
                      <span>Visiter le site</span>
                    </div>
                  </div>
                  <div className="dev-team-content">
                    <h3>{member.name}</h3>
                    <div className="dev-team-role">
                      <FaLaptopCode />
                      <span>{member.role}</span>
                    </div>
                    <p>{member.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="dev-team-controls">
              <div className="dev-team-dots">
                {devTeam.map((_, index) => (
                  <button
                    key={index}
                    className={`dev-team-dot ${
                      activeDevTeamMember === index ? "active" : ""
                    }`}
                    onClick={() => setActiveDevTeamMember(index)}
                    aria-label={`Membre de l'équipe ${index + 1}`}
                  />
                ))}
              </div>
              <div className="dev-team-arrows">
                <button
                  className="dev-team-arrow prev"
                  onClick={() =>
                    setActiveDevTeamMember((prev) =>
                      prev === 0 ? devTeam.length - 1 : prev - 1
                    )
                  }
                  aria-label="Membre précédent"
                >
                  <FaChevronLeft />
                </button>
                <button
                  className="dev-team-arrow next"
                  onClick={() =>
                    setActiveDevTeamMember((prev) =>
                      prev === devTeam.length - 1 ? 0 : prev + 1
                    )
                  }
                  aria-label="Membre suivant"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section des services */}
      <section id="services" ref={servicesRef} className="services-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Nos spécialités</span>
            <h2>Services ophtalmologiques spécialisés</h2>
          </div>

          <div className="services-all">
            <div className="services-list">
              <motion.div
                className="services-list-container"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div
                  className="carousel-container"
                  id="services-carousel"
                  ref={servicesCarouselRef}
                >
                  {/* Grouper les services par 3 pour le carrousel */}
                  {Array(Math.ceil(medicalServices.length / 3))
                    .fill()
                    .map((_, groupIndex) => (
                      <div key={groupIndex} className="carousel-slide">
                        <div className="medical-services-grid">
                          {medicalServices
                            .slice(groupIndex * 3, (groupIndex + 1) * 3)
                            .map((service, index) => (
                              <motion.div
                                key={index}
                                className="service-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                  duration: 0.5,
                                  delay: index * 0.1,
                                }}
                                style={{
                                  borderTopColor:
                                    service.color || "var(--primary)",
                                  background: `linear-gradient(to bottom, ${service.color}10, #ffffff)`,
                                }}
                                whileHover={{
                                  y: -10,
                                  boxShadow: `0 15px 30px ${service.color}30`,
                                }}
                              >
                                <div className="service-header">
                                  {service.icon && (
                                    <motion.div
                                      className="service-icon"
                                      style={{
                                        backgroundColor: `${service.color}20`,
                                        color: service.color,
                                        boxShadow: `0 5px 15px ${service.color}30`,
                                      }}
                                      whileHover={{
                                        rotate: 360,
                                        backgroundColor: service.color,
                                        color: "#ffffff",
                                      }}
                                      transition={{ duration: 0.6 }}
                                    >
                                      {service.icon}
                                    </motion.div>
                                  )}
                                  <h3
                                    className="service-name"
                                    style={{ color: service.color }}
                                  >
                                    {service.name}
                                  </h3>
                                </div>

                                {service.doctors &&
                                  service.doctors.length > 0 && (
                                    <div className="service-doctors-wrapper">
                                      <span
                                        className="service-doctors-label"
                                        style={{ color: service.color }}
                                      >
                                        Spécialistes
                                      </span>
                                      <ul className="doctors-list">
                                        {service.doctors.map((doctor, idx) => (
                                          <li key={idx} className="doctor-item">
                                            <FaUserMd
                                              className="doctor-icon"
                                              style={{ color: service.color }}
                                            />
                                            <span>{doctor}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Indicateurs du carrousel */}
                <div className="carousel-indicators">
                  {Array(Math.ceil(medicalServices.length / 3))
                    .fill()
                    .map((_, index) => (
                      <button
                        key={index}
                        className={`carousel-indicator ${
                          activeServiceSlide === index ? "active" : ""
                        }`}
                        onClick={() => navigateServiceSlide(index)}
                        aria-label={`Groupe de services ${index + 1}`}
                        id={`indicator-${index}`}
                        style={
                          activeServiceSlide === index
                            ? {
                                backgroundColor:
                                  medicalServices[index * 3]?.color ||
                                  "var(--primary)",
                              }
                            : {}
                        }
                      />
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section des avantages */}
      <section className="advantages-section">
        <div className="container">
          <div className="advantages-wrapper">
            <div className="advantages-image">
              <img
                src={monImage6}
                alt="Cabinet d'ophtalmologie"
              />
            </div>
            <div className="advantages-content">
              <div className="section-header text-start">
                <span className="section-badge">Pourquoi nous choisir</span>
                <h2>Une expertise ophtalmologique de pointe</h2>
                <p>
                  Le Cabinet d'Ophtalmologie s'engage à offrir des soins
                  oculaires de la plus haute qualité
                </p>
              </div>

              <div className="advantages-list">
                {advantages.map((advantage, index) => (
                  <motion.div
                    key={index}
                    className="advantage-item"
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="advantage-icon">{advantage.icon}</div>
                    <div className="advantage-content">
                      <h3>{advantage.title}</h3>
                      <p>{advantage.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section À propos */}
      <section id="about" ref={aboutRef} className="about-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">À propos de nous</span>
            <h2>Une histoire d'excellence et d'engagement</h2>
            <p>Un cabinet d'ophtalmologie de référence au Sénégal</p>
          </div>

          <div className="about-wrapper">
            <motion.div
              className="about-image"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src={monImage6}
                alt="Cabinet d'Ophtalmologie"
              />
            </motion.div>

            <motion.div
              className="about-content"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3>Notre mission</h3>
              <p>
                Le Cabinet d'Ophtalmologie s'engage à offrir des soins oculaires
                de la plus haute qualité à ses patients. Avec une équipe
                d'ophtalmologues spécialisés dans divers domaines, nous mettons
                tout en œuvre pour préserver et améliorer votre vision.
              </p>
              <p>
                Notre cabinet propose une approche globale de la santé oculaire,
                alliant médecine moderne, techniques chirurgicales avancées et
                accompagnement personnalisé pour chaque patient.
              </p>

              <div className="key-points">
                <div className="key-point">
                  <FaCheck />
                  <span>Équipe médicale hautement qualifiée</span>
                </div>
                <div className="key-point">
                  <FaCheck />
                  <span>Équipements ophtalmologiques de pointe</span>
                </div>
                <div className="key-point">
                  <FaCheck />
                  <span>Approche personnalisée pour chaque patient</span>
                </div>
                <div className="key-point">
                  <FaCheck />
                  <span>Environnement calme et accueillant</span>
                </div>
              </div>

              <div className="about-tabs">
                <div
                  className={`tab ${
                    activeSection === "history" ? "active" : ""
                  }`}
                >
                  <div
                    className="tab-header"
                    onClick={(e) => toggleSection("history", e)}
                  >
                    <h4>Notre histoire</h4>
                  </div>
                  <AnimatePresence>
                    <motion.div
                      className="tab-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>
                        Docteur d’état en médecine diplômé de l’UCAD. Son
                        doctorat de médecine générale en poche, il exerça durant
                        3 ans au service d’urgence de l’hôpital régional de
                        Saint louis. Ressentant la pénurie d’ophtalmologistes au
                        Sénégal (moins de 60 pour tout le pays), il entame une
                        spécialisation en ophtalmologie, puis exerce à l’hôpital
                        d’enfant de Diamniadio, ou en plus de ses compétences
                        d’ophtalmologiste (pour adultes), il ajoute à son
                        expertise des compétences d’ophtalmologie pédiatrique.
                        Reconnu pour sa spécialisation en chirurgie de la
                        cataracte par phacoémulsification, ayant été certifié en
                        Inde par le Dr. Toshniwal, une autorité mondiale dans ce
                        domaine ayant réalisé plus de 20 000 chirurgies par
                        phacoémulsification. Depuis 2019, le Dr. Ndiaye dirige
                        le Cabinet d’Ophtalmologie Dr. Mar NDIAYE à Fann
                        Résidence, offrant ses compétences professionnelles et
                        son expertise dans le domaine de l’ophtalmologie. Engagé
                        dans des actions humanitaires, il participe activement
                        au Centre Optique de Mbour et au Centre Communautaire de
                        Balapartenaire, en collaboration avec l’ONG
                        AMOA-CASAMASANTE, démontrant ainsi son dévouement envers
                        les servi
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div
                  className={`tab ${
                    activeSection === "values" ? "active" : ""
                  }`}
                >
                  <div
                    className="tab-header"
                    onClick={(e) => toggleSection("values", e)}
                  >
                    <h4>Nos valeurs</h4>
                  </div>
                  <AnimatePresence>
                    <motion.div
                      className="tab-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ul className="values-list">
                        <li>
                          <strong>Excellence</strong> – Offrir des soins
                          oculaires de qualité supérieure.
                        </li>
                        <li>
                          <strong>Bienveillance</strong> – Accompagner chaque
                          patient avec compassion.
                        </li>
                        <li>
                          <strong>Éthique</strong> – Assurer une prise en charge
                          transparente et professionnelle.
                        </li>
                        <li>
                          <strong>Innovation</strong> – Intégrer les dernières
                          avancées en ophtalmologie.
                        </li>
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section
        id="testimonials"
        ref={testimonialsRef}
        className="testimonials-section"
      >
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Témoignages</span>
            <h2>Ce que disent nos patients</h2>
            <p>Découvrez les expériences de ceux qui nous ont fait confiance</p>
          </div>

          <div className="testimonials-slider">
            <div className="testimonials-wrapper">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className={`testimonial-card ${
                    activeTestimonial === index ? "active" : ""
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeTestimonial === index ? 1 : 0,
                    display: activeTestimonial === index ? "flex" : "none",
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="testimonial-content">
                    <div className="quote-icon start">
                      <FaQuoteLeft />
                    </div>
                    <p>{testimonial.text}</p>
                    <div className="quote-icon end">
                      <FaQuoteRight />
                    </div>
                  </div>
                  <div className="testimonial-author">
                    <img src={testimonial.avatar} alt={testimonial.name} />
                    <div className="author-info">
                      <h4>{testimonial.name}</h4>
                      <p>{testimonial.role}</p>
                      <div className="rating">
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStar />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="testimonial-controls">
              <div className="testimonial-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`testimonial-dot ${
                      activeTestimonial === index ? "active" : ""
                    }`}
                    onClick={() => setActiveTestimonial(index)}
                    aria-label={`Témoignage ${index + 1}`}
                  />
                ))}
              </div>
              <div className="testimonial-arrows">
                <button
                  className="testimonial-arrow prev"
                  onClick={() =>
                    setActiveTestimonial((prev) =>
                      prev === 0 ? testimonials.length - 1 : prev - 1
                    )
                  }
                  aria-label="Témoignage précédent"
                >
                  <FaChevronLeft />
                </button>
                <button
                  className="testimonial-arrow next"
                  onClick={() =>
                    setActiveTestimonial((prev) =>
                      prev === testimonials.length - 1 ? 0 : prev + 1
                    )
                  }
                  aria-label="Témoignage suivant"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section id="contact" ref={contactRef} className="contact-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Contact</span>
            <h2>Contactez-nous</h2>
            <p>Nous sommes à votre disposition pour répondre à vos questions</p>
          </div>

          <div className="contact-wrapper">
            <div className="contact-info">
              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="contact-text">
                    <h3>Adresse</h3>
                    <p>
                      33 rue D x avenue Aime Cesaire, fann résidence – Dakar –
                      Sénégal
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaPhone />
                  </div>
                  <div className="contact-text">
                    <h3>Téléphone</h3>
                    <p>
                      (+221) 338242424 /
                       (+221) 338258058 /
                        (+221) 772329898  /
                        (+221) 779652698
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaEnvelope />
                  </div>
                  <div className="contact-text">
                    <h3>Email</h3>
                    <p>drmarndiaye@gmail.com</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <FaClock />
                  </div>
                  <div className="contact-text">
                    <h3>Horaires d'ouverture</h3>
                    <p>Lundi - Dimanche: 08H00 — 16H00</p>
                  </div>
                </div>
              </div>

              <div className="emergency-contact-box">
                <div className="emergency-icon">
                  <FaEye />
                </div>
                <div className="emergency-content">
                  <h3>Urgence ophtalmologique?</h3>
                  <p>Contactez notre service d'urgence</p>
                  <div className="emergency-number">+221-338242424</div>
                </div>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <h3>Envoyez-nous un message</h3>
              <form className="contact-form" ref={form} onSubmit={sendEmail}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="user_name">Nom complet</label>
                    <input
                      type="text"
                      name="user_name"
                      id="user_name"
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="user_email">Email</label>
                    <input
                      type="email"
                      name="user_email"
                      id="user_email"
                      placeholder="Votre email"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="user_phone">Téléphone</label>
                    <input
                      type="tel"
                      name="user_phone"
                      id="user_phone"
                      placeholder="Votre numéro de téléphone"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="user_service">Service</label>
                    <select name="user_service" id="user_service" required>
                      <option value="">Sélectionnez un service</option>
                      {medicalServices.map((service, index) => (
                        <option key={index} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    name="message"
                    id="message"
                    rows="5"
                    placeholder="Votre message"
                    required
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  className="btn-primary btn-submit"
                  disabled={formStatus.submitting}
                >
                  {formStatus.submitting
                    ? "Envoi en cours..."
                    : "Envoyer le message"}
                </Button>

                {formStatus.info.msg && (
                  <div
                    className={`form-message ${
                      formStatus.info.error ? "error" : "success"
                    }`}
                  >
                    {formStatus.info.msg}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Section Carte */}
      <section className="map-section">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.0517242430934!2d-17.4438!3d14.7077!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDQyJzI3LjciTiAxN8KwMjYnMzcuNyJX!5e0!3m2!1sfr!2s!4v1615554887163!5m2!1sfr!2s"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          title="Carte du Cabinet d'Ophtalmologie"
        ></iframe>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-about">
              <div className="footer-logo">
                <div className="logo-icon">
                  <FaEye />
                </div>
                <div className="logo-text">Cabinet d'Ophtalmologie</div>
              </div>
              <p>
                Le Cabinet d'Ophtalmologie Chirurgie Oculaire - Une technologie
                de pointe pour une vision optimale
              </p>
              <div className="social-links">
                <a href="#" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <h3>Liens rapides</h3>
              <ul>
                <li>
                  <a onClick={() => scrollToSection("hero")}>Accueil</a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("services")}>Services</a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("about")}>À propos</a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("testimonials")}>
                    Témoignages
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollToSection("contact")}>Contact</a>
                </li>
              </ul>
            </div>

            <div className="footer-services">
              <h3>Nos services</h3>
              <ul>
                <li>
                  <a href="#services">Consultation Ophtalmologique</a>
                </li>
                <li>
                  <a href="#services">Chirurgie de la Cataracte</a>
                </li>
                <li>
                  <a href="#services">Traitement du Glaucome</a>
                </li>
                <li>
                  <a href="#services">Chirurgie Réfractive</a>
                </li>
                <li>
                  <a href="#services">Ophtalmologie Pédiatrique</a>
                </li>
                <li>
                  <a href="#services">Et plus encore...</a>
                </li>
              </ul>
            </div>

            <div className="footer-contact">
              <h3>Contact</h3>
              <ul>
                <li>
                  <FaMapMarkerAlt />
                  <span>Cabinet d'Ophtalmologie, Dakar, Sénégal</span>
                </li>
                <li>
                  <FaPhone />
                  <span>+221-338242424</span>
                </li>
                <li>
                  <FaEnvelope />
                  <span>drmarndiaye@gmail.com</span>
                </li>
                <li>
                  <FaClock />
                  <span>Lun - Dim: 08H00 — 16H00</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} Cabinet d'Ophtalmologie
              Chirurgie Oculaire. Tous droits réservés.
            </p>
            <div className="footer-credits">
              <a href="https://sen-amd.vercel.app/">Développé par </a>
              <a href="https://sen-amd.vercel.app/">
                Sen assistance médicale Digitale
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Bouton flottant de rendez-vous */}
      <div
        className="floating-appointment"
        onClick={() => setShowAppointmentModal(true)}
      >
        <FaCalendarCheck />
        <span>Rendez-vous</span>
      </div>

      {/* Bouton flottant de connexion */}
      <div className="floating-login" onClick={() => navigate("/auth")}>
        <FaUser />
        <span>Connexion</span>
      </div>

      {/* Modal de rendez-vous */}
      <Modal
        show={showAppointmentModal}
        onHide={() => setShowAppointmentModal(false)}
        size="lg"
        centered
        className="appointment-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Demande de rendez-vous ophtalmologique</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Quick />
        </Modal.Body>
      </Modal>

      <style jsx>{`
        /* ===== VARIABLES ===== */
        :root {
          /* Couleurs principales - Adaptées pour l'ophtalmologie */
          --primary: #0070f3;
          --primary-rgb: 0, 112, 243;
          --primary-dark: #0050d0;
          --primary-light: #3291ff;
          --secondary: #00c58e;
          --accent: #ff9800;
          --success: #28a745;
          --success-rgb: 40, 167, 69;
          --danger: #dc3545;
          --danger-rgb: 220, 53, 69;
          --warning: #ffc107;
          --info: #17a2b8;

          /* Couleurs neutres */
          --dark: #1f2937;
          --medium: #4b5563;
          --light: #9ca3af;
          --lighter: #e5e7eb;
          --lightest: #f9fafb;
          --white: #ffffff;

          /* Typographie */
          --font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
            sans-serif;
          --font-size-xs: 0.75rem; /* 12px */
          --font-size-sm: 0.875rem; /* 14px */
          --font-size-base: 1rem; /* 16px */
          --font-size-lg: 1.125rem; /* 18px */
          --font-size-xl: 1.25rem; /* 20px */
          --font-size-2xl: 1.5rem; /* 24px */
          --font-size-3xl: 1.875rem; /* 30px */
          --font-size-4xl: 2.25rem; /* 36px */
          --font-size-5xl: 3rem; /* 48px */

          /* Espacement */
          --spacing-1: 0.25rem; /* 4px */
          --spacing-2: 0.5rem; /* 8px */
          --spacing-3: 0.75rem; /* 12px */
          --spacing-4: 1rem; /* 16px */
          --spacing-5: 1.25rem; /* 20px */
          --spacing-6: 1.5rem; /* 24px */
          --spacing-8: 2rem; /* 32px */
          --spacing-10: 2.5rem; /* 40px */
          --spacing-12: 3rem; /* 48px */
          --spacing-16: 4rem; /* 64px */
          --spacing-20: 5rem; /* 80px */

          /* Bordures */
          --border-radius-sm: 0.25rem; /* 4px */
          --border-radius: 0.5rem; /* 8px */
          --border-radius-md: 0.75rem; /* 12px */
          --border-radius-lg: 1rem; /* 16px */
          --border-radius-xl: 1.5rem; /* 24px */
          --border-radius-full: 9999px;

          /* Ombres */
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

          /* Transitions */
          --transition-fast: 150ms ease;
          --transition: 300ms ease;
          --transition-slow: 500ms ease;

          /* Z-index */
          --z-0: 0;
          --z-10: 10;
          --z-20: 20;
          --z-30: 30;
          --z-40: 40;
          --z-50: 50;
          --z-100: 100;
          --z-max: 9999;

          /* Conteneur */
          --container-padding: 1.5rem;
          --container-max-width: 1280px;

          /* Hauteur du header */
          --header-height: 80px;
          --header-height-mobile: 70px;
        }

        /* ===== STYLES GLOBAUX ===== */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: var(--font-family);
          color: var(--dark);
          background-color: var(--white);
          line-height: 1.6;
          overflow-x: hidden;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: var(--spacing-4);
        }

        p {
          margin-bottom: var(--spacing-4);
        }

        a {
          color: var(--primary);
          text-decoration: none;
          transition: color var(--transition-fast);
          cursor: pointer;
        }

        a:hover {
          color: var(--primary-dark);
        }

        img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        ul,
        ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        button {
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
        }

        .container {
          width: 100%;
          max-width: var(--container-max-width);
          padding-left: var(--container-padding);
          padding-right: var(--container-padding);
          margin-left: auto;
          margin-right: auto;
        }

        .home-page {
          position: relative;
        }

        /* ===== HEADER ===== */
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: var(--z-100);
          transition: all var(--transition);
          padding: var(--spacing-4) 0;
          background-color: transparent;
        }

        .site-header.scrolled {
          background-color: var(--white);
          box-shadow: var(--shadow);
          padding: var(--spacing-2) 0;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background-color: var(--primary);
          color: var(--white);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--font-size-xl);
          margin-right: var(--spacing-3);
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-name {
          font-weight: 700;
          font-size: var(--font-size-lg);
          color: var(--dark);
        }

        .scrolled .logo-name {
          color: var(--dark);
        }

        .logo-tagline {
          font-size: var(--font-size-xs);
          color: var(--medium);
        }

        .main-nav ul {
          display: flex;
          align-items: center;
          gap: var(--spacing-8);
        }

        .main-nav a {
          color: var(--white);
          font-weight: 500;
          position: relative;
          padding: var(--spacing-2) 0;
        }

        .scrolled .main-nav a {
          color: var(--dark);
        }

        .main-nav a::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--primary);
          transition: width var(--transition);
        }

        .main-nav a:hover::after,
        .main-nav li.active a::after {
          width: 100%;
        }

        .btn-appointment {
          background-color: var(--primary);
          color: var(--white);
          padding: var(--spacing-2) var(--spacing-6);
          border-radius: var(--border-radius-full);
          font-weight: 600;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow);
        }

        .btn-appointment:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .menu-toggle {
          width: 30px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-size: var(--font-size-xl);
          border-radius: var(--border-radius);
          background-color: var(--primary);
          box-shadow: var(--shadow);
        }

        .scrolled .menu-toggle {
          color: var(--white);
        }

        /* ===== MENU MOBILE ===== */
        .mobile-menu {
          width: 300px;
        }

        .mobile-menu .offcanvas-header {
          padding: var(--spacing-6);
          border-bottom: 1px solid var(--lighter);
        }

        .menu-close {
          color: var(--medium);
          font-size: var(--font-size-xl);
        }

        .mobile-nav {
          padding: var(--spacing-6) 0;
        }

        .mobile-nav ul {
          display: flex;
          flex-direction: column;
        }

        .mobile-nav li {
          border-bottom: 1px solid var(--lighter);
        }

        .mobile-nav a {
          display: block;
          padding: var(--spacing-4) var(--spacing-6);
          color: var(--dark);
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .mobile-nav a:hover {
          background-color: var(--lightest);
          color: var(--primary);
          padding-left: var(--spacing-8);
        }

        .mobile-actions {
          padding: 0 var(--spacing-6) var(--spacing-6);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-4);
        }

        .btn-block {
          display: block;
          width: 100%;
          text-align: center;
        }

        .btn-login {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--lightest);
          color: var(--dark);
          padding: var(--spacing-3) var(--spacing-4);
          border-radius: var(--border-radius);
          font-weight: 500;
        }

        .mobile-contact {
          padding: var(--spacing-6);
          background-color: var(--lightest);
          margin: var(--spacing-6);
          border-radius: var(--border-radius);
        }

        .mobile-contact h5 {
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-4);
          color: var(--primary);
        }

        .mobile-contact .contact-item {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-3);
          color: var(--medium);
        }

        .mobile-contact .contact-item svg {
          margin-right: var(--spacing-3);
          color: var(--primary);
        }

        .emergency-contact {
          display: flex;
          align-items: center;
          background-color: rgba(220, 53, 69, 0.1);
          padding: var(--spacing-3);
          border-radius: var(--border-radius);
          margin-top: var(--spacing-4);
        }

        .emergency-contact svg {
          color: var(--danger);
          font-size: var(--font-size-xl);
          margin-right: var(--spacing-3);
        }

        .emergency-contact div {
          display: flex;
          flex-direction: column;
        }

        .emergency-contact span {
          font-size: var(--font-size-xs);
          color: var(--medium);
        }

        .emergency-contact strong {
          color: var(--danger);
          font-size: var(--font-size-base);
        }

        /* ===== HERO SECTION ===== */
        .hero-section {
          position: relative;
          height: 100vh;
          min-height: 900px;
          overflow: hidden;
        }

        .hero-slider {
          position: relative;
          height: 100%;
          width: 100%;
        }

        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 1s ease;
          z-index: var(--z-0);
        }

        .hero-slide.active {
          opacity: 1;
          z-index: var(--z-10);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.8),
            rgba(0, 0, 0, 0.4)
          );
          z-index: var(--z-20);
        }

        .hero-content {
          position: relative;
          z-index: var(--z-30);
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: var(--header-height);
        }

        .hero-text {
          max-width: 600px;
          color: var(--white);
        }

        .hero-text h1 {
          font-size: var(--font-size-5xl);
          font-weight: 800;
          margin-bottom: var(--spacing-4);
          line-height: 1.2;
        }

        .hero-text h1 span {
          color: var(--primary-light);
        }

        .hero-tagline {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-8);
        }

        .hero-tagline span {
          margin: 0 var(--spacing-2);
          color: var(--accent);
          font-weight: 600;
        }

        .hero-features {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-8);
        }

        .feature-card {
          flex: 1 1 calc(33.333% - var(--spacing-4));
          min-width: 200px;
          display: flex;
          align-items: flex-start;
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: var(--spacing-4);
          border-radius: var(--border-radius);
          border-left: 3px solid var(--primary);
          transition: all var(--transition);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          background-color: rgba(255, 255, 255, 0.2);
        }

        .feature-icon {
          color: var(--primary-light);
          font-size: var(--font-size-2xl);
          margin-right: var(--spacing-3);
        }

        .feature-content h3 {
          font-size: var(--font-size-base);
          margin-bottom: var(--spacing-1);
          color: var(--white);
        }

        .feature-content p {
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0;
        }

        .hero-actions {
          display: flex;
          gap: var(--spacing-4);
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          background-color: var(--primary);
          color: var(--white);
          padding: var(--spacing-3) var(--spacing-8);
          border-radius: var(--border-radius-full);
          font-weight: 600;
          transition: all var(--transition);
          box-shadow: var(--shadow);
        }

        .btn-primary svg {
          margin-left: var(--spacing-2);
          transition: transform var(--transition);
        }

        .btn-primary:hover {
          background-color: var(--primary-dark);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        .btn-primary:hover svg {
          transform: translateX(3px);
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          background-color: transparent;
          color: var(--white);
          padding: var(--spacing-3) var(--spacing-8);
          border-radius: var(--border-radius-full);
          font-weight: 600;
          border: 2px solid var(--white);
          transition: all var(--transition);
        }

        .btn-outline svg {
          margin-left: var(--spacing-2);
          transition: transform var(--transition);
        }

        .btn-outline:hover {
          background-color: var(--white);
          color: var(--primary);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        .btn-outline:hover svg {
          transform: translateX(3px);
        }

        .hero-card {
          width: 320px;
          background-color: var(--white);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          background: linear-gradient(
            135deg,
            var(--primary),
            var(--primary-dark)
          );
          color: white;
          padding: 1rem;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .card-header::after {
          content: "";
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
        }

        .header-icon-container {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.8rem;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .header-icon {
          font-size: 1.1rem;
          color: white;
        }

        .card-header h3 {
          font-size: 1.2rem;
          margin: 0;
          font-weight: 600;
        }

        .card-body {
          padding: 1rem;
        }

        .schedule-container {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .schedule-section {
          border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
          padding-bottom: 0.8rem;
        }

        .schedule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .day-label {
          font-weight: 600;
          color: var(--dark);
          font-size: 0.85rem;
        }

        .time-label {
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .section-title {
          font-weight: 700;
          color: var(--primary);
          font-size: 1rem;
          margin-bottom: 0.8rem;
          padding-bottom: 0.3rem;
          border-bottom: 2px dotted rgba(0, 112, 243, 0.2);
          display: inline-block;
        }

        .activity-grid {
          display: grid;
          gap: 0.5rem;
        }

        .activity-item {
          background-color: rgba(var(--primary-rgb), 0.03);
          border-radius: 8px;
          padding: 0.5rem 0.8rem;
          transition: all 0.2s ease;
          border-left: 2px solid var(--primary);
        }

        .activity-name {
          font-weight: 700;
          color: var(--dark);
          font-size: 0.85rem;
        }

        .activity-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.3rem;
        }

        .activity-days {
          font-size: 0.75rem;
          color: var(--medium);
          background-color: rgba(0, 0, 0, 0.05);
          padding: 0.1rem 0.4rem;
          border-radius: 20px;
        }

        .activity-times {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          align-items: flex-end;
        }

        .activity-times span {
          font-size: 0.7rem;
          color: var(--primary);
          background-color: white;
          padding: 0.1rem 0.4rem;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .emergency-box {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #ff9a9e, #fad0c4);
          padding: 0.8rem;
          border-radius: 12px;
          margin-top: 0.8rem;
          box-shadow: 0 4px 15px rgba(255, 154, 158, 0.2);
        }

        .emergency-icon {
          width: 32px;
          height: 32px;
          background-color: white;
          color: #ff6b6b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          margin-right: 0.8rem;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .emergency-info {
          display: flex;
          flex-direction: column;
        }

        .emergency-info span {
          font-size: 0.65rem;
          color: white;
          opacity: 0.9;
        }

        .emergency-info strong {
          font-size: 0.95rem;
          color: white;
          font-weight: 700;
        }

        .slider-controls {
          position: absolute;
          bottom: var(--spacing-8);
          left: 0;
          width: 100%;
          z-index: var(--z-30);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .slider-dots {
          display: flex;
          gap: var(--spacing-2);
          margin-bottom: var(--spacing-4);
        }

        .slider-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          transition: all var(--transition);
          cursor: pointer;
        }

        .slider-dot.active {
          background-color: var(--white);
          transform: scale(1.2);
        }

        .slider-arrows {
          display: flex;
          gap: var(--spacing-4);
        }

        .slider-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.2);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-base);
          transition: all var(--transition);
          backdrop-filter: blur(5px);
        }

        .slider-arrow:hover {
          background-color: var(--white);
          color: var(--primary);
          transform: translateY(-3px);
        }

        /* ===== SECTION COMMUNE ===== */
        section {
          padding: var(--spacing-20) 0;
        }

        .section-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto var(--spacing-12);
        }

        .section-header.text-start {
          text-align: left;
          margin-left: 0;
        }

        .section-badge {
          display: inline-block;
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: var(--spacing-4);
        }

        .section-header h2 {
          font-size: var(--font-size-4xl);
          margin-bottom: var(--spacing-4);
          color: var(--dark);
        }

        .section-header p {
          font-size: var(--font-size-lg);
          color: var(--medium);
        }

        /* ===== SERVICES SECTION ===== */
        .services-section {
          background-color: var(--lightest);
        }

        .services-filter {
          margin-bottom: var(--spacing-10);
        }

        .filter-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--spacing-2);
        }

        .filter-tabs li {
          margin-bottom: var(--spacing-2);
        }

        .filter-tabs button {
          background-color: var(--white);
          color: var(--dark);
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--border-radius-full);
          font-weight: 500;
          transition: all var(--transition);
          box-shadow: var(--shadow-sm);
        }

        .filter-tabs li.active button {
          background-color: var(--primary);
          color: var(--white);
          box-shadow: var(--shadow);
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-6);
          margin-bottom: var(--spacing-12);
        }

        .service-card {
          background-color: var(--white);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-6);
          box-shadow: var(--shadow);
          transition: all var(--transition);
          position: relative;
          overflow: hidden;
          border-top: 4px solid var(--accent-color, var(--primary));
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .service-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-lg);
        }

        .service-icon {
          width: 60px;
          height: 60px;
          background-color: rgba(
            var(--accent-color-rgb, var(--primary-rgb)),
            0.1
          );
          color: var(--accent-color, var(--primary));
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-4);
          transition: all var(--transition);
        }

        .service-card:hover .service-icon {
          transform: rotateY(180deg);
        }

        .service-card h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-3);
          color: var(--dark);
        }

        .service-card p {
          color: var(--medium);
          margin-bottom: var(--spacing-4);
        }

        .service-doctors {
          margin-top: var(--spacing-4);
          padding-top: var(--spacing-4);
          border-top: 1px dashed var(--lighter);
        }

        .service-doctors h4 {
          font-size: var(--font-size-base);
          color: var(--primary);
          margin-bottom: var(--spacing-2);
        }

        .service-doctors ul {
          padding-left: var(--spacing-4);
        }

        .service-doctors li {
          position: relative;
          padding-left: var(--spacing-4);
          margin-bottom: var(--spacing-2);
          font-size: var(--font-size-sm);
          color: var(--medium);
        }

        .service-doctors li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--primary);
          font-size: var(--font-size-lg);
        }

        .service-link {
          display: inline-flex;
          align-items: center;
          color: var(--primary);
          font-weight: 600;
          margin-top: auto;
          padding-top: var(--spacing-4);
        }

        .service-link svg {
          margin-left: var(--spacing-2);
          transition: transform var(--transition);
        }

        .service-link:hover svg {
          transform: translateX(5px);
        }

        .services-action {
          text-align: center;
        }

        /* ===== SPECIALISTS SECTION ===== */
        .specialists-section {
          background-color: var(--white);
        }

        .specialists-accordion {
          max-width: 900px;
          margin: 0 auto;
        }

        .accordion-item {
          background-color: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          margin-bottom: var(--spacing-4);
          overflow: hidden;
        }

        .accordion-header {
          padding: var(--spacing-5);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .accordion-header:hover {
          background-color: var(--lightest);
        }

        .accordion-item.active .accordion-header {
          background-color: var(--primary);
        }

        .accordion-header h3 {
          font-size: var(--font-size-lg);
          margin-bottom: 0;
          color: var(--dark);
          transition: color var(--transition-fast);
        }

        .accordion-item.active .accordion-header h3 {
          color: var(--white);
        }

        .accordion-icon {
          color: var(--primary);
          transition: all var(--transition);
        }

        .accordion-item.active .accordion-icon {
          color: var(--white);
          transform: rotate(180deg);
        }

        .accordion-content {
          padding: var(--spacing-5);
          background-color: var(--white);
          border-top: 1px solid var(--lighter);
        }

        .doctors-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--spacing-4);
        }

        .doctors-list li {
          display: flex;
          align-items: center;
          padding: var(--spacing-3);
          background-color: var(--lightest);
          border-radius: var(--border-radius);
          transition: all var(--transition);
        }

        .doctors-list li:hover {
          transform: translateX(5px);
          background-color: rgba(var(--primary-rgb), 0.05);
        }

        .doctors-list li svg {
          color: var(--primary);
          margin-right: var(--spacing-3);
          font-size: var(--font-size-lg);
        }

        .doctors-list li span {
          font-size: var(--font-size-sm);
          color: var(--dark);
        }

        /* ===== ADVANTAGES SECTION ===== */
        .advantages-section {
          background-color: var(--lightest);
          position: relative;
          overflow: hidden;
        }

        .advantages-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-8);
          align-items: center;
        }

        .advantages-image {
          position: relative;
          height: 100%;
          min-height: 500px;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .advantages-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .advantages-content {
          padding: var(--spacing-6);
        }

        .advantages-list {
          margin-top: var(--spacing-8);
        }

        .advantage-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: var(--spacing-6);
          transition: all var(--transition);
        }

        .advantage-item:hover {
          transform: translateX(10px);
        }

        .advantage-icon {
          width: 60px;
          height: 60px;
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-2xl);
          margin-right: var(--spacing-4);
          flex-shrink: 0;
          transition: all var(--transition);
        }

        .advantage-item:hover .advantage-icon {
          background-color: var(--primary);
          color: var(--white);
          transform: rotateY(180deg);
        }

        .advantage-content h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-2);
          color: var(--dark);
        }

        .advantage-content p {
          color: var(--medium);
          margin-bottom: 0;
        }

        /* ===== ABOUT SECTION ===== */
        .about-section {
          background-color: var(--white);
        }

        .about-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-8);
          align-items: center;
        }

        .about-image {
          position: relative;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .about-image img {
          width: 100%;
          transition: transform var(--transition-slow);
        }

        .about-image:hover img {
          transform: scale(1.05);
        }

        .about-content h3 {
          font-size: var(--font-size-3xl);
          margin-bottom: var(--spacing-4);
          color: var(--dark);
          position: relative;
          padding-bottom: var(--spacing-4);
        }

        .about-content h3::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 80px;
          height: 4px;
          background-color: var(--primary);
        }

        .about-content p {
          color: var(--medium);
          margin-bottom: var(--spacing-4);
        }

        .key-points {
          margin: var(--spacing-6) 0;
        }

        .key-point {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-3);
        }

        .key-point svg {
          color: var(--success);
          margin-right: var(--spacing-3);
          font-size: var(--font-size-base);
        }

        .key-point span {
          font-weight: 500;
          color: var(--dark);
        }

        .about-tabs {
          margin-top: var(--spacing-8);
        }

        .tab {
          background-color: var(--white);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          margin-bottom: var(--spacing-4);
          overflow: hidden;
        }

        .tab-header {
          padding: var(--spacing-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .tab-header:hover {
          background-color: var(--lightest);
        }

        .tab.active .tab-header {
          background-color: var(--primary);
        }

        .tab-header h4 {
          font-size: var(--font-size-lg);
          margin-bottom: 0;
          color: var(--dark);
          transition: color var(--transition-fast);
        }

        .tab.active .tab-header h4 {
          color: var(--white);
        }

        .tab-header svg {
          color: var(--primary);
          transition: all var(--transition);
        }

        .tab.active .tab-header svg {
          color: var(--white);
          transform: rotate(180deg);
        }

        .tab-content {
          padding: var(--spacing-4);
          background-color: var(--white);
          border-top: 1px solid var(--lighter);
        }

        .values-list {
          list-style: none;
          padding: 0;
        }

        .values-list li {
          position: relative;
          padding-left: var(--spacing-6);
          margin-bottom: var(--spacing-3);
          color: var(--medium);
        }

        .values-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--primary);
          font-size: var(--font-size-xl);
        }

        .values-list li strong {
          color: var(--dark);
          margin-right: var(--spacing-2);
        }

        /* ===== TESTIMONIALS SECTION ===== */
        .testimonials-section {
          background-color: var(--lightest);
        }

        .testimonials-slider {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }

        .testimonials-wrapper {
          position: relative;
          min-height: 300px;
        }

        .testimonial-card {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          background-color: var(--white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-6);
          display: flex;
          flex-direction: column;
        }

        .testimonial-content {
          position: relative;
          padding: var(--spacing-4) var(--spacing-6);
          margin-bottom: var(--spacing-6);
        }

        .quote-icon {
          position: absolute;
          color: rgba(var(--primary-rgb), 0.1);
          font-size: var(--font-size-3xl);
        }

        .quote-icon.start {
          top: 0;
          left: 0;
        }

        .quote-icon.end {
          bottom: 0;
          right: 0;
        }

        .testimonial-content p {
          font-size: var(--font-size-lg);
          color: var(--dark);
          font-style: italic;
          text-align: center;
          margin: 0;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          padding-top: var(--spacing-4);
          border-top: 1px solid var(--lighter);
        }

        .testimonial-author img {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--primary);
          margin-right: var(--spacing-4);
        }

        .author-info h4 {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-1);
          color: var(--dark);
        }

        .author-info p {
          font-size: var(--font-size-sm);
          color: var(--medium);
          margin-bottom: var(--spacing-2);
        }

        .rating {
          color: var(--warning);
          font-size: var(--font-size-base);
        }

        .testimonial-controls {
          margin-top: var(--spacing-8);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .testimonial-dots {
          display: flex;
          gap: var(--spacing-2);
          margin-bottom: var(--spacing-4);
        }

        .testimonial-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--lighter);
          transition: all var(--transition);
          cursor: pointer;
        }

        .testimonial-dot.active {
          background-color: var(--primary);
          transform: scale(1.2);
        }

        .testimonial-arrows {
          display: flex;
          gap: var(--spacing-4);
        }

        .testimonial-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--white);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-base);
          transition: all var(--transition);
          box-shadow: var(--shadow);
        }

        .testimonial-arrow:hover {
          background-color: var(--primary);
          color: var(--white);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        /* ===== CONTACT SECTION ===== */
        .contact-section {
          background-color: var(--white);
        }

        .contact-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-8);
        }

        .contact-info {
          display: flex;
          flex-direction: column;
        }

        .contact-items {
          margin-bottom: var(--spacing-6);
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: var(--spacing-6);
        }

        .contact-icon {
          width: 60px;
          height: 60px;
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-2xl);
          margin-right: var(--spacing-4);
          flex-shrink: 0;
          transition: all var(--transition);
        }

        .contact-item:hover .contact-icon {
          background-color: var(--primary);
          color: var(--white);
          transform: rotateY(180deg);
        }

        .contact-text h3 {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-2);
          color: var(--dark);
        }

        .contact-text p {
          color: var(--medium);
          margin-bottom: var(--spacing-1);
        }

        .emergency-contact-box {
          display: flex;
          align-items: center;
          background-color: var(--white);
          padding: var(--spacing-6);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow);
          border-left: 5px solid var(--primary);
          margin-top: auto;
          transition: all var(--transition);
        }

        .emergency-contact-box:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .emergency-icon {
          width: 70px;
          height: 70px;
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-3xl);
          margin-right: var(--spacing-6);
          flex-shrink: 0;
        }

        .emergency-content h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-2);
          color: var(--dark);
        }

        .emergency-content p {
          color: var(--medium);
          margin-bottom: var(--spacing-2);
        }

        .emergency-number {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--primary);
        }

        .contact-form-wrapper {
          background-color: var(--white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-8);
        }

        .contact-form-wrapper h3 {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-6);
          color: var(--dark);
          position: relative;
          padding-bottom: var(--spacing-4);
        }

        .contact-form-wrapper h3::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 4px;
          background-color: var(--primary);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-4);
        }

        .form-group {
          margin-bottom: var(--spacing-4);
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: var(--spacing-2);
          color: var(--dark);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: var(--spacing-3) var(--spacing-4);
          border: 1px solid var(--lighter);
          border-radius: var(--border-radius);
          background-color: var(--white);
          color: var(--dark);
          transition: all var(--transition-fast);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
        }

        .btn-submit {
          width: 100%;
          padding: var(--spacing-4);
          font-size: var(--font-size-lg);
        }

        .form-message {
          margin-top: var(--spacing-4);
          padding: var(--spacing-3) var(--spacing-4);
          border-radius: var(--border-radius);
          font-weight: 500;
        }

        .form-message.success {
          background-color: rgba(var(--success-rgb), 0.1);
          color: var(--success);
          border-left: 3px solid var(--success);
        }

        .form-message.error {
          background-color: rgba(var(--danger-rgb), 0.1);
          color: var(--danger);
          border-left: 3px solid var(--danger);
        }

        /* ===== MAP SECTION ===== */
        .map-section {
          padding: 0;
          height: 450px;
        }

        .map-section iframe {
          display: block;
        }

        /* ===== FOOTER ===== */
        .site-footer {
          background-color: #1a2238;
          color: rgba(255, 255, 255, 0.7);
          padding: var(--spacing-16) 0 0;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: var(--spacing-8);
          margin-bottom: var(--spacing-12);
        }

        .footer-about {
          margin-right: var(--spacing-8);
        }

        .footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-4);
        }

        .footer-logo .logo-icon {
          background-color: var(--primary);
        }

        .footer-logo .logo-text {
          color: var(--white);
          font-weight: 700;
          font-size: var(--font-size-xl);
        }

        .footer-about p {
          margin-bottom: var(--spacing-6);
          line-height: 1.8;
        }

        .social-links {
          display: flex;
          gap: var(--spacing-3);
        }

        .social-links a {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition);
        }

        .social-links a:hover {
          background-color: var(--primary);
          transform: translateY(-3px);
        }

        .footer-links h3,
        .footer-services h3,
        .footer-contact h3 {
          color: var(--white);
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-6);
          position: relative;
          padding-bottom: var(--spacing-3);
        }

        .footer-links h3::after,
        .footer-services h3::after,
        .footer-contact h3::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 40px;
          height: 3px;
          background-color: var(--primary);
        }

        .footer-links ul li,
        .footer-services ul li {
          margin-bottom: var(--spacing-3);
        }

        .footer-links ul a,
        .footer-services ul a {
          color: rgba(255, 255, 255, 0.7);
          transition: all var(--transition-fast);
          display: inline-block;
          position: relative;
          padding-left: var(--spacing-4);
        }

        .footer-links ul a::before,
        .footer-services ul a::before {
          content: "›";
          position: absolute;
          left: 0;
          color: var(--primary);
        }

        .footer-links ul a:hover,
        .footer-services ul a:hover {
          color: var(--white);
          transform: translateX(5px);
        }

        .footer-contact ul li {
          display: flex;
          align-items: flex-start;
          margin-bottom: var(--spacing-4);
        }

        .footer-contact ul li svg {
          color: var(--primary);
          margin-right: var(--spacing-3);
          margin-top: 5px;
        }

        .footer-bottom {
          padding: var(--spacing-6) 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-bottom p {
          margin-bottom: 0;
        }

        .footer-credits a {
          color: rgba(255, 255, 255, 0.7);
          margin-left: var(--spacing-2);
        }

        .footer-credits a:hover {
          color: var(--primary);
        }

        /* ===== FLOATING BUTTONS ===== */
        .floating-appointment,
        .floating-login {
          position: fixed;
          z-index: var(--z-50);
          transition: all var(--transition);
          display: flex;
          align-items: center;
          box-shadow: var(--shadow-lg);
          cursor: pointer;
          border-radius: var(--border-radius-full);
          padding: var(--spacing-3) var(--spacing-6);
        }

        .floating-appointment {
          bottom: var(--spacing-6);
          right: var(--spacing-6);
          background-color: var(--primary);
          color: var(--white);
        }

        .floating-login {
          bottom: calc(
            var(--spacing-6) + 60px
          ); /* Position au-dessus du bouton rendez-vous */
          right: var(--spacing-6);
          background-color: var(--white);
          color: var(--primary);
        }

        .floating-appointment:hover,
        .floating-login:hover {
          transform: translateY(-5px);
        }

        .floating-appointment svg,
        .floating-login svg {
          margin-right: var(--spacing-2);
        }

        /* ===== APPOINTMENT MODAL ===== */
        .appointment-modal .modal-content {
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          border: none;
          box-shadow: var(--shadow-xl);
        }

        .appointment-modal .modal-header {
          background-color: var(--primary);
          color: var(--white);
          border: none;
        }

        .appointment-modal .modal-title {
          font-weight: 700;
          font-size: var(--font-size-xl);
        }

        .appointment-modal .modal-header .btn-close {
          color: var(--white);
          opacity: 1;
          box-shadow: none;
        }

        /* ===== DEV TEAM SECTION ===== */
        .dev-team-section {
          background-color: var(--lightest);
          padding: var(--spacing-16) 0;
        }

        .dev-team-carousel {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }

        .dev-team-wrapper {
          position: relative;
          min-height: 400px;
        }

        .dev-team-card {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          background-color: var(--white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition);
        }

        .dev-team-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-xl);
        }

        .dev-team-image {
          position: relative;
          height: 250px;
          overflow: hidden;
        }

        .dev-team-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition);
        }

        .dev-team-card:hover .dev-team-image img {
          transform: scale(1.05);
        }

        .dev-team-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(var(--primary-rgb), 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--white);
          opacity: 0;
          transition: opacity var(--transition);
        }

        .dev-team-card:hover .dev-team-overlay {
          opacity: 1;
        }

        .dev-team-overlay svg {
          font-size: var(--font-size-3xl);
          margin-bottom: var(--spacing-2);
        }

        .dev-team-overlay span {
          font-weight: 600;
        }

        .dev-team-content {
          padding: var(--spacing-6);
        }

        .dev-team-content h3 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-2);
          color: var(--dark);
        }

        .dev-team-role {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-4);
          color: var(--primary);
        }

        .dev-team-role svg {
          margin-right: var(--spacing-2);
        }

        .dev-team-role span {
          font-weight: 500;
        }

        .dev-team-content p {
          color: var(--medium);
          margin-bottom: 0;
        }

        .dev-team-controls {
          margin-top: var(--spacing-8);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .dev-team-dots {
          display: flex;
          gap: var(--spacing-2);
          margin-bottom: var(--spacing-4);
        }

        .dev-team-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--lighter);
          transition: all var(--transition);
          cursor: pointer;
        }

        .dev-team-dot.active {
          background-color: var(--primary);
          transform: scale(1.2);
        }

        .dev-team-arrows {
          display: flex;
          gap: var(--spacing-4);
        }

        .dev-team-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--white);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-base);
          transition: all var(--transition);
          box-shadow: var(--shadow);
        }

        .dev-team-arrow:hover {
          background-color: var(--primary);
          color: var(--white);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        /* ===== SERVICES CAROUSEL ===== */
        .carousel-container {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
          gap: var(--spacing-4);
          margin-bottom: var(--spacing-6);
        }

        .carousel-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        .carousel-slide {
          flex: 0 0 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        .medical-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-6);
        }

        .service-header {
          margin-bottom: var(--spacing-4);
        }

        .service-name {
          font-size: var(--font-size-lg);
          margin-top: var(--spacing-3);
          margin-bottom: var(--spacing-2);
        }

        .service-doctors-wrapper {
          margin-top: var(--spacing-4);
        }

        .service-doctors-label {
          display: inline-block;
          font-size: var(--font-size-xs);
          font-weight: 600;
          margin-bottom: var(--spacing-2);
          padding-bottom: 2px;
          border-bottom: 2px solid;
        }

        .doctors-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2);
        }

        .doctor-item {
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
          color: var(--medium);
        }

        .doctor-icon {
          margin-right: var(--spacing-2);
          font-size: 0.8em;
        }

        .carousel-indicators {
          display: flex;
          justify-content: center;
          gap: var(--spacing-2);
          margin-top: var(--spacing-6);
        }

        .carousel-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--lighter);
          transition: all var(--transition);
          cursor: pointer;
          border: none;
        }

        .carousel-indicator.active {
          background-color: var(--primary);
          transform: scale(1.2);
        }

        /* ===== RESPONSIVE STYLES ===== */
        @media (max-width: 1200px) {
          .footer-top {
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-8) var(--spacing-16);
          }

          .footer-about {
            margin-right: 0;
          }

          .hero-content {
            flex-direction: column;
            justify-content: center;
            gap: var(--spacing-8);
          }

          .hero-text {
            max-width: 100%;
          }

          .hero-card {
            width: 100%;
            max-width: 400px;
          }
        }

        @media (max-width: 992px) {
          :root {
            --font-size-5xl: 2.5rem;
            --font-size-4xl: 2rem;
            --font-size-3xl: 1.75rem;
          }

          .advantages-wrapper,
          .about-wrapper,
          .contact-wrapper {
            grid-template-columns: 1fr;
            gap: var(--spacing-8);
          }

          .advantages-image,
          .about-image {
            min-height: 400px;
            order: -1;
          }

          .medical-services-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero-features {
            flex-direction: column;
          }

          .feature-card {
            flex: 1 1 100%;
          }
        }

        @media (max-width: 768px) {
          :root {
            --spacing-20: 4rem;
            --spacing-16: 3rem;
            --spacing-12: 2.5rem;
            --font-size-5xl: 2.25rem;
            --font-size-4xl: 1.75rem;
          }

          .hero-section {
            min-height: 800px;
          }

          .footer-top {
            grid-template-columns: 1fr;
            gap: var(--spacing-8);
          }

          .footer-bottom {
            flex-direction: column;
            gap: var(--spacing-4);
            text-align: center;
          }

          .medical-services-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-primary,
          .btn-outline {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          :root {
            --font-size-5xl: 2rem;
            --font-size-4xl: 1.5rem;
            --font-size-3xl: 1.35rem;
            --font-size-2xl: 1.25rem;
            --spacing-20: 3rem;
            --spacing-16: 2.5rem;
          }

          .hero-text h1 {
            font-size: var(--font-size-4xl);
          }

          .hero-tagline {
            font-size: var(--font-size-base);
          }

          .section-header h2 {
            font-size: var(--font-size-3xl);
          }

          .floating-appointment,
          .floating-login {
            padding: var(--spacing-3) var(--spacing-4);
          }

          .floating-appointment span,
          .floating-login span {
            display: none;
          }

          .floating-appointment svg,
          .floating-login svg {
            margin-right: 0;
          }

          .contact-form-wrapper {
            padding: var(--spacing-4);
          }

          .emergency-contact-box {
            padding: var(--spacing-4);
          }

          .emergency-icon {
            width: 50px;
            height: 50px;
            font-size: var(--font-size-xl);
            margin-right: var(--spacing-4);
          }

          .emergency-number {
            font-size: var(--font-size-xl);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
