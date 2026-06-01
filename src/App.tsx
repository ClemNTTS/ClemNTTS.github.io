import { useEffect, useMemo, useRef, useState } from "react";

const githubUser = "ClemNTTS";
const repoApiUrl = `https://api.github.com/users/${githubUser}/repos?sort=updated&per_page=100`;
const chatApiUrl =
  import.meta.env.VITE_CHAT_API_URL ||
  (window.location.hostname.endsWith("netlify.app") ? "/api/chat" : "https://clemntts.netlify.app/api/chat");

type ProjectKind = "all" | "ia" | "jeu" | "outil";

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  updated_at?: string;
};

type ProjectRepo = GitHubRepo & {
  kind: Exclude<ProjectKind, "all">;
  glyph: string;
  color: "green" | "amber" | "cyan" | "blue";
  summary: string;
  tags: string[];
};

type NodeSlot = {
  left: number;
  top: number;
  x: number;
  y: number;
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const fallbackRepos: GitHubRepo[] = [
  {
    name: "sort-me",
    description:
      "Une app open source self-hosted qui classe automatiquement les emails dans des categories grace a des regles ecrites en langage naturel",
    html_url: "https://github.com/ClemNTTS/sort-me",
    homepage: "",
    language: "Rust",
    topics: [],
    fork: false,
    archived: false,
  },
  {
    name: "elden-chill",
    description: "Fan web game in the world of Elden Ring, take your sword and let's defeat some bosses !",
    html_url: "https://github.com/ClemNTTS/elden-chill",
    homepage: "https://clemntts.github.io/elden-chill/",
    language: "JavaScript",
    topics: ["fangame", "html5", "local-state"],
    fork: false,
    archived: false,
  },
  {
    name: "wiki-elden-chill",
    description: "Wiki for my elden-chill game",
    html_url: "https://github.com/ClemNTTS/wiki-elden-chill",
    homepage: "https://cnuttens.me/wiki-elden-chill/",
    language: "JavaScript",
    topics: [],
    fork: false,
    archived: false,
  },
  {
    name: "ClemNTTS.github.io",
    description: "Portfolio et terrain d'experimentation web.",
    html_url: "https://github.com/ClemNTTS/ClemNTTS.github.io",
    homepage: "",
    language: "HTML",
    topics: [],
    fork: false,
    archived: false,
  },
  {
    name: "kaggle-titanic",
    description:
      "My contribution for the Kaggle exercice named Titanic, i already reached 0.79+ accuracy with this code.",
    html_url: "https://github.com/ClemNTTS/kaggle-titanic",
    homepage: "",
    language: "Python",
    topics: [],
    fork: false,
    archived: false,
  },
];

const nodeSlots: NodeSlot[] = [
  { left: 12, top: 12, x: 220, y: 130 },
  { left: 68, top: 17, x: 725, y: 155 },
  { left: 72, top: 45, x: 775, y: 285 },
  { left: 58, top: 74, x: 680, y: 405 },
  { left: 9, top: 62, x: 190, y: 385 },
  { left: 2, top: 40, x: 125, y: 260 },
  { left: 34, top: 6, x: 370, y: 90 },
  { left: 36, top: 80, x: 380, y: 455 },
];

const stackItems = [
  ["Langages", "Rust, TypeScript, JavaScript, Python"],
  ["Backend & data", "Node.js, FastAPI, SQLAlchemy, PostgreSQL"],
  ["Frontend & jeu", "HTML, CSS, Canvas, Phaser, GitHub Pages"],
  ["IA / data", "PyTorch, Pandas, LangChain, scikit-learn"],
  ["Cloud & DevOps", "Azure, Terraform, CI/CD, GitHub Actions"],
  ["Environnement", "Git, Docker, Linux, Neovim, VS Code"],
] as const;

function repoKind(repo: GitHubRepo): ProjectRepo["kind"] {
  const haystack = [repo.name, repo.description, repo.language, ...(repo.topics ?? [])]
    .join(" ")
    .toLowerCase();

  if (/(game|jeu|elden|fangame|phaser|wiki)/.test(haystack)) return "jeu";
  if (/(^|\W)(ai|ia|ml|data|kaggle|sql|langchain|pytorch|pandas|titanic|nl2sql|langage naturel)(\W|$)/.test(haystack)) {
    return "ia";
  }
  return "outil";
}

function repoGlyph(repo: GitHubRepo, kind: ProjectRepo["kind"]) {
  const name = repo.name.toLowerCase();
  if (name.includes("wiki")) return "book";
  if (name.includes("elden")) return "sword";
  if (name.includes("sql")) return "sql";
  if (kind === "ia") return "data";
  if ((repo.language ?? "").toLowerCase() === "rust") return "cube";
  return "repo";
}

function repoColor(kind: ProjectRepo["kind"], index: number): ProjectRepo["color"] {
  if (kind === "ia") return index % 2 ? "blue" : "cyan";
  if (kind === "jeu") return index % 2 ? "amber" : "green";
  return "green";
}

function repoSummary(repo: GitHubRepo) {
  return repo.description || "Depot public GitHub, pret a etre documente comme une vraie mission.";
}

function repoTags(repo: GitHubRepo, kind: ProjectRepo["kind"]) {
  return [repo.language, ...(repo.topics ?? []), kind]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 4);
}

function linkLabel(repo: ProjectRepo) {
  if (repo.homepage) return repo.name.includes("elden-chill") ? "Ouvrir / jouer" : "Ouvrir la demo";
  return "Voir le repo";
}

function normalizeRepos(repos: GitHubRepo[]): ProjectRepo[] {
  return repos
    .filter((repo) => !repo.fork && !repo.archived && repo.name !== githubUser)
    .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
    .slice(0, nodeSlots.length)
    .map((repo, index) => {
      const kind = repoKind(repo);
      return {
        ...repo,
        kind,
        glyph: repoGlyph(repo, kind),
        color: repoColor(kind, index),
        summary: repoSummary(repo),
        tags: repoTags(repo, kind),
      };
    });
}

async function askAssistant(question: string, repos: ProjectRepo[]) {
  const response = await fetch(chatApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      projects: repos.map((repo) => ({
        name: repo.name,
        description: repo.summary,
        language: repo.language,
        kind: repo.kind,
        url: repo.html_url,
        homepage: repo.homepage,
        tags: repo.tags,
      })),
    }),
  });

  const payload = (await response.json().catch(() => null)) as { answer?: string; error?: string } | null;

  if (!response.ok || !payload?.answer) {
    throw new Error(payload?.error || "L'assistant n'a pas repondu.");
  }

  return payload.answer;
}

function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(90, Math.floor(window.innerWidth / 16)) }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        size: Math.random() * 1.4 + 0.5,
      }));
    };

    const drawParticles = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.fillStyle = "rgba(184, 255, 92, 0.65)";
      context.strokeStyle = "rgba(243, 239, 226, 0.08)";

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
        if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 118) {
            context.globalAlpha = 1 - distance / 118;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      context.globalAlpha = 1;
      frame = requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    drawParticles();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas id="signal-field" ref={canvasRef} aria-hidden="true" />;
}

function App() {
  const [repos, setRepos] = useState<ProjectRepo[]>(() => normalizeRepos(fallbackRepos));
  const [repoSource, setRepoSource] = useState<"GitHub" | "secours">("secours");
  const [activeFilter, setActiveFilter] = useState<ProjectKind>("all");
  const [activeProject, setActiveProject] = useState("core");
  const [chatInput, setChatInput] = useState("Pourquoi ce projet t'a marque ?");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading" | "error">("idle");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Je peux repondre sur Clement, ses projets, sa stack et son parcours. Sur GitHub Pages je suis en veille; sur Netlify je parle via Mistral.",
    },
  ]);

  useEffect(() => {
    let ignore = false;

    async function loadRepos() {
      try {
        const response = await fetch(repoApiUrl, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        const data = (await response.json()) as GitHubRepo[];
        if (!ignore) {
          setRepos(normalizeRepos(data));
          setRepoSource("GitHub");
        }
      } catch (error) {
        console.warn(error);
        if (!ignore) {
          setRepos(normalizeRepos(fallbackRepos));
          setRepoSource("secours");
        }
      }
    }

    void loadRepos();
    return () => {
      ignore = true;
    };
  }, []);

  const visibleRepos = useMemo(() => {
    if (activeFilter === "all") return repos;
    return repos.filter((repo) => repo.kind === activeFilter);
  }, [activeFilter, repos]);

  const readout = useMemo(() => {
    if (activeProject === "core") {
      return repoSource === "GitHub"
        ? `${repos.length} repos publics detectes depuis GitHub. Selectionne un noeud pour inspecter le signal.`
        : "Mode secours : l'API GitHub n'a pas repondu, la carte utilise une copie locale.";
    }

    const selected = repos.find((repo) => repo.name === activeProject);
    return selected
      ? `${selected.name} : ${selected.summary}`
      : "Selectionne un noeud pour reveler l'histoire du projet.";
  }, [activeProject, repoSource, repos]);

  return (
    <>
      <SignalField />
      <header className="topbar">
        <a className="brand" href="#accueil" aria-label="Retour a l'accueil">
          <span className="prompt-mark">&gt;_</span>
          <span>cnuttens@zone01:~</span>
        </a>
        <nav className="nav-links" aria-label="Navigation principale">
          <a href="#projets">Projets</a>
          <a href="#competences">Competences</a>
          <a href="#assistant">IA</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="status-link" href="https://github.com/ClemNTTS" target="_blank" rel="noreferrer">
          GitHub actif
        </a>
      </header>

      <main>
        <section className="hero" id="accueil">
          <div className="hero-copy">
            <h1>
              Clement <span>Nuttens</span>
            </h1>
            <p className="lead">
              Developpeur en formation a Zone01. Je construis des projets utiles, ludiques, parfois un peu
              bizarres, souvent connectes a l'IA.
            </p>

            <div className="command-list" aria-label="Traits principaux">
              <p>
                <span>&gt;</span> Curieux par defaut
              </p>
              <p>
                <span>&gt;</span> Rust, TypeScript, JavaScript, Python
              </p>
              <p>
                <span>&gt;</span> Jeux web, outils locaux, IA appliquee
              </p>
              <p>
                <span>&gt;</span> Toujours un terminal ouvert
              </p>
            </div>

            <div className="hero-actions">
              <a className="btn primary" href="#projets">
                Explorer les projets
              </a>
              <a className="btn ghost" href="#contact">
                Connecter le signal
              </a>
            </div>

            <div className="terminal-card" aria-label="Terminal rapide">
              <div className="terminal-line">cnuttens@zone01:~$ whoami</div>
              <div className="terminal-output">
                Etudiant . Batisseur . Joueur . Explorateur<span className="cursor" />
              </div>
            </div>
          </div>

          <div className="map-shell" aria-label="Carte interactive des projets">
            <div className="map-toolbar">
              <span>Carte des projets</span>
              {(["all", "ia", "jeu", "outil"] as ProjectKind[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={activeFilter === filter ? "active" : ""}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter === "all" ? "Tous" : filter === "ia" ? "IA" : filter === "jeu" ? "Jeux" : "Outils"}
                </button>
              ))}
            </div>

            <div className="project-map">
              <svg className="map-lines" viewBox="0 0 900 560" aria-hidden="true">
                <g>
                  {repos.map((repo, index) => {
                    const slot = nodeSlots[index];
                    if (!slot) return null;
                    return (
                      <path
                        key={repo.name}
                        d={`M450 280 C${(450 + slot.x) / 2} ${slot.y}, ${slot.x} ${(280 + slot.y) / 2}, ${slot.x} ${slot.y}`}
                      />
                    );
                  })}
                </g>
                <circle cx="450" cy="280" r="160" />
                <circle cx="450" cy="280" r="245" />
              </svg>

              <button
                className={`core-node ${activeProject === "core" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveProject("core")}
                aria-label="Centre de la carte"
              >
                cn
              </button>

              <div className="repo-nodes" aria-live="polite">
                {repos.map((repo, index) => {
                  const slot = nodeSlots[index];
                  const isDimmed = activeFilter !== "all" && repo.kind !== activeFilter;
                  return (
                    <button
                      key={repo.name}
                      className={`project-node ${activeProject === repo.name ? "active" : ""} ${isDimmed ? "dimmed" : ""}`}
                      type="button"
                      style={{ left: `${slot.left}%`, top: `${slot.top}%` }}
                      onClick={() => setActiveProject(repo.name)}
                    >
                      <span className="node-icon">{repo.glyph}</span>
                      <strong>{repo.name}</strong>
                      <small>
                        {repo.language || repo.kind} - {repoSource}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="map-readout" aria-live="polite">
              <span>Journal de bord</span>
              <p>{readout}</p>
            </aside>
          </div>
        </section>

        <section className="project-section" id="projets">
          <div className="section-heading">
            <h2>Projets en mission</h2>
            <a href="https://github.com/ClemNTTS?tab=repositories" target="_blank" rel="noreferrer">
              Voir tous les repos
            </a>
          </div>

          <div className="project-grid" aria-live="polite">
            {visibleRepos.map((repo) => (
              <article className="project-card" key={repo.name}>
                <div className="card-top">
                  <span className="glyph">{repo.glyph}</span>
                  <span className={`dot ${repo.color}`} />
                </div>
                <h3>{repo.name}</h3>
                <p>{repo.summary}</p>
                <div className="tags">
                  {repo.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <a href={repo.homepage || repo.html_url} target="_blank" rel="noreferrer">
                  {linkLabel(repo)}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="lab-section" id="competences">
          <div className="stack-panel">
            <h2>Stack & outils</h2>
            <div className="stack-list">
              {stackItems.map(([label, value]) => (
                <p key={label}>
                  <strong>{label}</strong> {value}
                </p>
              ))}
            </div>
            <div className="progress-line">
              <span>Esprit d'apprenti eternel</span>
              <meter min="0" max="100" value="92">
                92%
              </meter>
            </div>
          </div>

          <div className="assistant-panel" id="assistant">
            <h2>Assistant IA</h2>
            <form
              className="assistant-console"
              onSubmit={(event) => {
                event.preventDefault();
                const question = chatInput.trim();
                if (!question || chatStatus === "loading") return;

                setChatMessages((messages) => [...messages, { role: "user", content: question }]);
                setChatInput("");
                setChatStatus("loading");

                void askAssistant(question, repos)
                  .then((answer) => {
                    setChatMessages((messages) => [...messages, { role: "assistant", content: answer }]);
                    setChatStatus("idle");
                  })
                  .catch(() => {
                    setChatMessages((messages) => [
                      ...messages,
                      {
                        role: "assistant",
                        content:
                          "Je suis pret cote interface, mais l'endpoint Netlify /api/chat n'est pas encore disponible ici. Une fois le site deploye sur Netlify avec MISTRAL_API_KEY, je repondrai en direct.",
                      },
                    ]);
                    setChatStatus("error");
                  });
              }}
            >
              <p className="console-green">&gt; // futur module integre</p>
              <p>Posez-moi une question sur Clement, ses projets, son parcours ou ses choix techniques.</p>
              <div className="chat-log" aria-live="polite">
                {chatMessages.map((message, index) => (
                  <p className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                    <span>{message.role === "assistant" ? "cn-assistant" : "visiteur"}</span>
                    {message.content}
                  </p>
                ))}
                {chatStatus === "loading" ? (
                  <p className="chat-message assistant">
                    <span>cn-assistant</span>
                    Synchronisation avec Mistral...
                  </p>
                ) : null}
              </div>
              <label className="chat-input-label" htmlFor="chat-question">
                Question
              </label>
              <textarea
                id="chat-question"
                value={chatInput}
                rows={3}
                maxLength={420}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Demande-lui son projet le plus interessant, sa stack, ou ce qu'il cherche."
              />
              <button
                type="button"
                className="prompt-chip"
                onClick={() => setChatInput("Quel projet represente le mieux Clement comme developpeur ?")}
              >
                Suggere-moi un angle
              </button>
              <button type="submit" id="assistant-preview" disabled={chatStatus === "loading"}>
                {chatStatus === "loading" ? "Transmission..." : "Envoyer au copilote"}
              </button>
            </form>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-intro">
            <h2>Connecter le signal</h2>
            <p>Une idee, une opportunite, un projet a challenger ? Les canaux sont ouverts.</p>
          </div>
          <div className="contact-grid">
            <a href="mailto:clement.nutt@gmail.com">
              <span>Email</span>
              <strong>clement.nutt@gmail.com</strong>
            </a>
            <a href="https://github.com/ClemNTTS" target="_blank" rel="noreferrer">
              <span>GitHub</span>
              <strong>github.com/ClemNTTS</strong>
            </a>
            <a href="https://fr.linkedin.com/in/cl%C3%A9ment-nuttens" target="_blank" rel="noreferrer">
              <span>LinkedIn</span>
              <strong>linkedin.com/in/clement-nuttens</strong>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}

export default App;
