import React, { useState, useEffect, useRef } from "react";
import {
  Lock,
  Unlock,
  Play,
  Heart,
  X,
  Music,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Camera,
  Plus,
  Save,
  Upload,
  Loader,
  Trash2,
  Settings,
  ImageOff,
  Edit3,
  LogOut,
} from "lucide-react";

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";

// --- [사용자 설정] Firebase Config ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD3dJLbi-WRmbK_SFqWYb1CvXFAan3rmr8",
  authDomain: "misowedding-545a7.firebaseapp.com",
  projectId: "misowedding-545a7",
  storageBucket: "misowedding-545a7.firebasestorage.app",
  messagingSenderId: "98220169026",
  appId: "1:98220169026:web:0a10b092b5b73e43fe1adb",
  measurementId: "G-B0H1Q0F6SW",
};

const APP_ID = "miso-wedding";

// --- Default/Static Data (Structure & Fallback Content) ---
const DEFAULT_PHASE_DATA = {
  phases: ["10s", "20s", "30s", "video"],
  "10s": {
    title: "10대: 질풍노도의 시기",
    subtitle: "싸이월드 감성, 그 눈물 셀카...",
    description:
      "눈물 없이는 볼 수 없는 그녀의 중2병 시절. 버디버디 아이디 기억나니?",
  },
  "20s": {
    title: "20대: 광란의 대학생활",
    subtitle: "MT, 술, 그리고 첫사랑...",
    description: "흑역사의 황금기. 지우고 싶은 기억과 지워지지 않는 술버릇.",
  },
  "30s": {
    title: "30대: 멋진 커리어우먼(진)",
    subtitle: "현실 타협과 결혼 준비",
    description:
      "이제 좀 어른 같나 싶었는데 결혼이라니! 그래도 제일 예쁜 우리 미소.",
  },
  video: {
    title: "To. 세상에서 제일 예쁜 신부",
    subtitle: "우리가 준비한 마지막 선물",
    description: "플레이 버튼을 눌러주세요.",
    videoSrc: "https://placehold.co/600x400/000000/ffffff?text=PLAY+VIDEO",
  },
};

const USER_PASSWORD = "1004"; // 미소용
const ADMIN_PASSWORD = "7979"; // 친구들용 (친구친구)

// --- Utility: Resize Image ---
const resizeImage = (base64Str, maxWidth = 600) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = maxWidth;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};

// --- Components ---

const PixelAvatar = ({ color = "#FF00FF", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block"
  >
    <rect x="8" y="4" width="8" height="8" fill="#FFE0BD" />
    <rect x="8" y="4" width="8" height="2" fill="black" />
    <rect x="6" y="5" width="2" height="6" fill="black" />
    <rect x="16" y="5" width="2" height="6" fill="black" />
    <rect x="9" y="7" width="2" height="2" fill="black" />
    <rect x="13" y="7" width="2" height="2" fill="black" />
    <rect x="10" y="10" width="4" height="1" fill="#FF9999" />
    <rect x="8" y="12" width="8" height="8" fill={color} />
    <path d="M7 13H5V16H7V13Z" fill={color} />
    <path d="M17 13H19V16H17V13Z" fill={color} />
    <rect x="9" y="20" width="2" height="4" fill="black" />
    <rect x="13" y="20" width="2" height="4" fill="black" />
  </svg>
);

const RetroCard = ({ children, className = "" }) => (
  <div
    className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${className}`}
  >
    {children}
  </div>
);

const RetroButton = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}) => {
  const baseStyle =
    "w-full py-3 font-bold border-2 border-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2";
  const variants = {
    primary:
      "bg-[#FF00FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#D900D9]",
    secondary:
      "bg-[#00FFFF] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#00E6E6]",
    action:
      "bg-[#FFFF00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#E6E600]",
    danger:
      "bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600",
    disabled:
      "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none border-gray-400",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${
        disabled ? variants.disabled : variants[variant]
      } ${className}`}
    >
      {children}
    </button>
  );
};

// --- Modals ---

// Updated DetailModal with Navigation
const DetailModal = ({ item, items, onClose, onChange }) => {
  if (!item) return null;

  const currentIndex = items.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handlePrev = (e) => {
    e.stopPropagation();
    if (hasPrev) onChange(items[currentIndex - 1]);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (hasNext) onChange(items[currentIndex + 1]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm animate-fade-in">
      {/* Navigation Buttons (Outside Card) */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border-2 border-black p-2 z-50 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-[-40%] transition-all hover:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border-2 border-black p-2 z-50 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-[-40%] transition-all hover:bg-gray-100"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <div className="bg-white w-full max-w-sm border-2 border-black shadow-[8px_8px_0px_0px_#FF00FF] relative flex flex-col max-h-[90vh]">
        <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
          <span className="font-bold text-sm truncate">{item.title}</span>
          <button
            onClick={onClose}
            className="hover:bg-red-500 p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="border-2 border-gray-200 p-1 bg-gray-50">
            <img
              src={item.src}
              alt={item.title}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="mt-4 bg-[#F5F5F5] border border-gray-300 p-3 relative">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex flex-col items-center">
                <PixelAvatar size={32} color={item.avatarColor || "#000"} />
                <span className="text-[10px] font-bold mt-1">
                  {item.author}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug">
                  {item.comment.split(":")[1] || item.comment}
                </p>
                <span className="text-[10px] text-gray-400 block mt-2 text-right">
                  {item.createdAt?.seconds
                    ? new Date(item.createdAt.seconds * 1000).toLocaleString()
                    : "방금 전"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 border-t-2 border-gray-100 bg-gray-50 text-center flex justify-between items-center text-xs text-gray-400">
          <span>
            {currentIndex + 1} / {items.length}
          </span>
          <button
            onClick={onClose}
            className="w-1/2 py-2 bg-black text-white font-bold text-sm hover:bg-gray-800 ml-auto"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// Phase Settings Edit Modal (Updated for Video)
const PhaseEditModal = ({ isOpen, onClose, phaseKey, initialData, onSave }) => {
  const [data, setData] = useState({
    title: "",
    subtitle: "",
    description: "",
    videoSrc: "",
  });

  useEffect(() => {
    if (initialData)
      setData({ ...initialData, videoSrc: initialData.videoSrc || "" });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFF0F5] w-full max-w-sm border-2 border-black shadow-[8px_8px_0px_0px_#FFFF00] p-4 space-y-4">
        <div className="flex justify-between items-center border-b-2 border-gray-300 pb-2">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Edit3 size={20} /> 탭 설정 수정
          </h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold block mb-1">제목 (Title)</label>
            <input
              type="text"
              className="w-full border-2 border-black p-2 bg-white"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1">
              소제목 (Subtitle)
            </label>
            <input
              type="text"
              className="w-full border-2 border-black p-2 bg-white"
              value={data.subtitle}
              onChange={(e) => setData({ ...data, subtitle: e.target.value })}
            />
          </div>
          {/* Only Show Video URL Input for Video Phase */}
          {phaseKey === "video" && (
            <div>
              <label className="text-xs font-bold block mb-1">
                영상 주소 (Video URL)
              </label>
              <input
                type="text"
                className="w-full border-2 border-black p-2 bg-white"
                value={data.videoSrc}
                onChange={(e) => setData({ ...data, videoSrc: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-[10px] text-gray-500 mt-1">
                * MP4 파일 주소나 썸네일로 쓸 이미지 주소
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-bold block mb-1">
              설명 (Description)
            </label>
            <textarea
              className="w-full border-2 border-black p-2 bg-white h-20 resize-none"
              value={data.description}
              onChange={(e) =>
                setData({ ...data, description: e.target.value })
              }
            />
          </div>
        </div>
        <RetroButton onClick={() => onSave(phaseKey, data)} variant="primary">
          <Save size={18} /> 설정 저장하기
        </RetroButton>
      </div>
    </div>
  );
};

const UploadModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const [post, setPost] = useState({
    title: "",
    author: "김누리",
    comment: "",
    phase: "10s",
    image: null,
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen)
      setPost({
        title: "",
        author: "김누리",
        comment: "",
        phase: "10s",
        image: null,
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPost((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!post.title || !post.comment) {
      alert("제목과 코멘트를 입력해주세요!");
      return;
    }
    onUpload(post);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFF0F5] w-full max-w-sm border-2 border-black shadow-[8px_8px_0px_0px_#00FFFF] p-4 space-y-4">
        <div className="flex justify-between items-center border-b-2 border-gray-300 pb-2">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Camera size={20} /> 추억 업로드 (Admin)
          </h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        {isUploading ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
            <Loader className="animate-spin text-[#FF00FF]" size={40} />
            <p className="font-bold">
              추억 저장 중...
              <br />
              (사진 압축하는 중!)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1">시대 선택</label>
              <select
                className="w-full border-2 border-black p-2 font-bold bg-white"
                value={post.phase}
                onChange={(e) => setPost({ ...post, phase: e.target.value })}
              >
                <option value="10s">10대</option>
                <option value="20s">20대</option>
                <option value="30s">30대</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">사진 첨부</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-black bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <>
                    <Upload size={20} className="mb-1 text-gray-400" />
                    <span className="text-xs text-gray-500 font-bold">
                      사진 선택
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">제목</label>
              <input
                type="text"
                className="w-full border-2 border-black p-2 bg-white"
                placeholder="예: 흑역사 생성의 날"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">작성자</label>
              <div className="flex gap-2">
                {["김누리", "이주희", "모민희"].map((name) => (
                  <button
                    key={name}
                    onClick={() => setPost({ ...post, author: name })}
                    className={`flex-1 py-2 text-xs font-bold border-2 ${
                      post.author === name
                        ? "bg-[#FF00FF] text-white border-black"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">일촌평</label>
              <textarea
                className="w-full border-2 border-black p-2 bg-white h-16 resize-none"
                placeholder="촌철살인 한마디..."
                value={post.comment}
                onChange={(e) => setPost({ ...post, comment: e.target.value })}
              />
            </div>
          </div>
        )}
        {!isUploading && (
          <RetroButton onClick={handleSubmit} variant="action">
            <Save size={18} /> 저장하기
          </RetroButton>
        )}
      </div>
    </div>
  );
};

export default function TimeCapsuleApp() {
  const [view, setView] = useState("login");
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [progress, setProgress] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);

  // States for Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null); // For Phase Edit Modal

  // Data States
  const [phaseData, setPhaseData] = useState(DEFAULT_PHASE_DATA);
  const [firebaseItems, setFirebaseItems] = useState([]);

  // Firebase Auth/DB
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [appId] = useState(APP_ID); // 사용자가 지정한 앱 ID 사용

  // 1. Initialize Firebase & Auth (사용자 설정 적용)
  useEffect(() => {
    // 사용자가 제공한 설정값 사용
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const database = getFirestore(app);
    setDb(database);

    const initAuth = async () => {
      // 익명 로그인 사용
      await signInAnonymously(auth);
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Sync Items (Memories)
  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, "artifacts", appId, "public", "data", "memories")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      items.sort(
        (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
      );
      setFirebaseItems(items);
    });
    return () => unsubscribe();
  }, [user, db, appId]);

  // 3. Sync Phase Settings (Title, Subtitle, Desc)
  useEffect(() => {
    if (!user || !db) return;
    const unsubscribe = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "phase_settings"),
      (snapshot) => {
        const newPhaseData = { ...DEFAULT_PHASE_DATA };
        let hasData = false;
        snapshot.forEach((doc) => {
          if (doc.id !== "phases") {
            // Safety check
            newPhaseData[doc.id] = { ...newPhaseData[doc.id], ...doc.data() };
            hasData = true;
          }
        });
        if (hasData) setPhaseData(newPhaseData);
      }
    );
    return () => unsubscribe();
  }, [user, db, appId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === USER_PASSWORD) {
      setIsAdmin(false);
      setView("main");
    } else if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setView("main");
    } else {
      setErrorMsg("코드 불일치! (힌트: 미소=1004, 관리자=7979)");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  const handleLogout = () => {
    setView("login");
    setIsAdmin(false);
    setPasswordInput("");
  };

  const handleNextStage = () => {
    if (progress <= currentTab) {
      const nextStage = progress + 1;
      setProgress(nextStage);
      if (nextStage < phaseData.phases.length) setCurrentTab(nextStage);
    } else {
      if (currentTab < phaseData.phases.length - 1)
        setCurrentTab(currentTab + 1);
    }
  };

  const handlePhaseUpdate = async (phaseKey, newData) => {
    if (!db) return;
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "phase_settings",
          phaseKey
        ),
        newData,
        { merge: true }
      );
      setEditingPhase(null);
    } catch (error) {
      console.error("Failed to update settings", error);
      alert("설정 저장 실패");
    }
  };

  const handleUpload = async (newPost) => {
    if (!user || !db) return;
    setIsUploading(true);
    try {
      let finalImageSrc = newPost.image;
      if (newPost.image && newPost.image.length > 100000) {
        finalImageSrc = await resizeImage(newPost.image);
      }
      if (!finalImageSrc) {
        finalImageSrc = `https://placehold.co/400x300/${Math.floor(
          Math.random() * 16777215
        ).toString(16)}/ffffff?text=${encodeURIComponent(newPost.title)}`;
      }
      const newItem = {
        type: "photo",
        title: newPost.title,
        src: finalImageSrc,
        comment: `${newPost.author}: ${newPost.comment}`,
        author: newPost.author,
        avatarColor:
          newPost.author === "김누리"
            ? "#FF69B4"
            : newPost.author === "이주희"
            ? "#00BFFF"
            : "#FFA500",
        phase: newPost.phase,
        createdAt: serverTimestamp(),
        userId: user.uid,
      };
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "memories"),
        newItem
      );
      setShowUploadModal(false);
      const phaseIndex = phaseData.phases.indexOf(newPost.phase);
      setCurrentTab(phaseIndex);
    } catch (error) {
      console.error("Upload failed", error);
      alert("업로드 실패! 사진 용량이 너무 클 수 있습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e, itemId) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (!confirm("정말 이 추억을 삭제하시겠습니까? (복구 불가)")) return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "memories", itemId)
      );
    } catch (error) {
      console.error("Delete failed", error);
      alert("삭제 실패");
    }
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-[#FFF0F5] flex flex-col items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="absolute top-10 left-10 opacity-20 transform -rotate-12">
        <PixelAvatar size={80} color="#FF00FF" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-20 transform rotate-12">
        <PixelAvatar size={80} color="#00FFFF" />
      </div>
      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center space-y-4 animate-bounce">
          <h1 className="text-4xl font-black text-[#FF00FF] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] tracking-tighter">
            TIME CAPSULE
            <br />
            MISO
          </h1>
          <p className="text-lg font-bold text-gray-700 bg-white border-2 border-black inline-block px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            🚫 열어보지 말았어야 할 흑역사
          </p>
        </div>
        <RetroCard className="space-y-6">
          <div className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-2 text-[#FF00FF]" />
            <p className="font-bold text-lg">보안 코드 입력</p>
            <p className="text-sm text-gray-500">
              유미소 본인만 접근 가능합니다.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              maxLength="4"
              placeholder="CODE"
              className="w-full text-center text-3xl font-black py-4 border-b-4 border-black bg-transparent focus:outline-none focus:border-[#00FFFF] tracking-[1rem]"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            {errorMsg && (
              <p className="text-red-500 text-sm font-bold text-center animate-pulse">
                {errorMsg}
              </p>
            )}
            <RetroButton onClick={handleLogin}>잠금 해제</RetroButton>
            <p className="text-xs text-center text-gray-400 mt-2">
              Hint: 1004(User) / 7979(Admin)
            </p>
          </form>
        </RetroCard>
      </div>
    </div>
  );

  const renderTimelineNav = () => (
    <div className="sticky top-0 z-40 bg-[#FFF0F5] border-b-2 border-black p-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div className="flex space-x-2 max-w-md mx-auto">
        {phaseData.phases.map((phase, idx) => {
          // Admin always unlocked, User follows progress
          const isUnlocked = isAdmin ? true : idx <= progress;
          const isActive = idx === currentTab;
          let label =
            phase === "10s"
              ? "10대"
              : phase === "20s"
              ? "20대"
              : phase === "30s"
              ? "30대"
              : "영상";
          return (
            <button
              key={phase}
              disabled={!isUnlocked}
              onClick={() => setCurrentTab(idx)}
              className={`px-4 py-2 font-bold text-sm border-2 border-black transition-all flex items-center space-x-1 rounded-none ${
                isActive
                  ? "bg-[#FF00FF] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
                  : ""
              } ${
                !isActive && isUnlocked
                  ? "bg-white text-black hover:bg-gray-100"
                  : ""
              } ${
                !isUnlocked
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400"
                  : ""
              }`}
            >
              {!isUnlocked && <Lock size={12} className="mr-1" />}
              {isUnlocked && phase === "video" && (
                <Play size={12} className="mr-1" />
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Moved displayItems calculation here to pass to DetailModal
  const phaseKey = phaseData.phases[currentTab];
  const dynamicItems = firebaseItems.filter((item) => item.phase === phaseKey);
  const displayItems = [...dynamicItems];

  const renderContent = () => {
    const data = phaseData[phaseKey];

    if (phaseKey === "video") {
      return (
        <div className="space-y-6 animate-fade-in text-center p-4 pb-24">
          {/* Admin Edit Trigger */}
          {isAdmin && (
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setEditingPhase(phaseKey)}
                className="bg-black text-white px-3 py-1 text-xs font-bold flex items-center gap-1 hover:bg-gray-800"
              >
                <Edit3 size={12} /> 텍스트 수정
              </button>
            </div>
          )}

          <div className="bg-black p-1 border-4 border-double border-gray-400 shadow-xl">
            <div className="bg-gray-900 aspect-video flex flex-col items-center justify-center text-white relative overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                <Play size={64} className="text-white drop-shadow-lg" />
              </div>
              <img
                src={data.videoSrc || DEFAULT_PHASE_DATA.video.videoSrc}
                alt="Final Video"
                className="w-full h-full object-cover opacity-60"
              />
              <p className="absolute bottom-4 text-sm blink">CLICK TO PLAY</p>
            </div>
          </div>
          <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_#00FFFF] relative">
            <div className="absolute -top-4 -right-4 bg-yellow-300 border-2 border-black p-1 rotate-12">
              <span className="text-xs font-bold">New!</span>
            </div>
            <div className="flex justify-center space-x-4 mb-4 border-b-2 border-dashed border-gray-300 pb-4">
              {["#FF69B4", "#00BFFF", "#FFA500"].map((c, i) => (
                <div key={i} className="text-center">
                  <PixelAvatar color={c} />
                  <p className="text-xs font-bold mt-1">
                    {["누리", "주희", "민희"][i]}
                  </p>
                </div>
              ))}
            </div>
            {/* Dynamic Description */}
            <p className="font-handwriting text-lg leading-relaxed whitespace-pre-wrap">
              {data.description || DEFAULT_PHASE_DATA.video.description}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-24 px-4">
        {/* Admin Header with Edit Button */}
        <div className="relative">
          <div className="bg-[#FFFF00] border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center transform -rotate-1 relative z-10">
            <div className="absolute -top-3 -left-3 rotate-[-10deg]">
              <PixelAvatar size={32} color="#000" />
            </div>
            <h2 className="text-xl font-black mb-1">{data.title}</h2>
            <p className="text-sm font-bold border-t-2 border-black pt-2 mt-2">
              {data.subtitle}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditingPhase(phaseKey)}
              className="absolute -top-6 right-0 bg-black text-white px-2 py-1 text-xs font-bold flex items-center gap-1 z-20 shadow-md hover:scale-105 transition-transform"
            >
              <Settings size={12} /> 설정 수정
            </button>
          )}
        </div>

        <p className="text-gray-600 text-sm text-center bg-white p-2 border border-gray-300">
          {data.description}
        </p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Empty State for Non-Admins */}
          {displayItems.length === 0 && !isAdmin && (
            <div className="col-span-2 text-center py-10 bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500">
              <ImageOff className="mb-2 opacity-50" />
              <p className="font-bold">아직 등록된 흑역사가 없어요!</p>
              <p className="text-xs mt-1">
                친구들이 관리자 모드로 로그인해서
                <br />
                추억을 채워줄 예정입니다 :)
              </p>
            </div>
          )}

          {/* Items */}
          {displayItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group cursor-pointer relative"
            >
              <div className="aspect-square bg-gray-200 border-2 border-black overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-[3px_3px_0px_0px_#FF00FF] transition-all relative">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0"
                />
                <div className="absolute bottom-0 right-0 bg-white border-t-2 border-l-2 border-black px-1">
                  <PixelAvatar size={20} color={item.avatarColor || "#000"} />
                </div>

                {/* Delete Button (Admin Only) */}
                {isAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-sm opacity-100 hover:bg-red-700 z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs font-bold mt-2 text-center truncate px-1 bg-white inline-block w-full border border-gray-200">
                {item.title}
              </p>
            </div>
          ))}

          {/* Upload Button (Admin Only) */}
          {isAdmin && (
            <div
              onClick={() => setShowUploadModal(true)}
              className="aspect-square bg-[#F0F0F0] border-2 border-black border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-colors group"
            >
              <div className="bg-[#FF00FF] text-white p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500">
                추억 추가하기
              </span>
            </div>
          )}
        </div>

        {/* Next Stage Button: Hidden for Admin, Shown for User */}
        {!isAdmin && progress === currentTab && (
          <div className="mt-8">
            <RetroButton onClick={handleNextStage} variant="secondary">
              {currentTab < phaseData.phases.length - 2
                ? "다음 시기로 이동하기 👉"
                : "지옥의 30대 완료! 영상 보기 🎬"}
            </RetroButton>
          </div>
        )}
      </div>
    );
  };

  if (view === "login") return renderLogin();

  return (
    <div className="min-h-screen bg-[#FDF5E6] font-sans selection:bg-[#FF00FF] selection:text-white pb-safe">
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out forwards; } .font-handwriting { font-family: 'Courier New', Courier, monospace; } .scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
      <header className="bg-white border-b-2 border-black p-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <PixelAvatar size={28} color="#FF00FF" />
          <h1 className="font-black text-lg tracking-tighter text-[#FF00FF] drop-shadow-[1px_1px_0px_#000]">
            MISO WORLD
          </h1>
          {isAdmin && (
            <span className="bg-red-500 text-white text-[10px] px-1 font-bold border border-black animate-pulse">
              ADMIN
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center space-x-2 text-xs font-bold bg-black text-white px-2 py-1 rounded-none border border-black shadow-[2px_2px_0px_0px_rgba(200,200,200,1)]">
            <Music size={12} className="animate-spin-slow" />
            <span>Now Playing: 프리스타일 - Y</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white border-2 border-black p-1 hover:bg-red-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="로그아웃"
          >
            <LogOut size={16} className="text-red-500" />
          </button>
        </div>
      </header>
      {renderTimelineNav()}
      <main className="max-w-md mx-auto pt-6 animate-fade-in min-h-[calc(100vh-140px)]">
        {renderContent()}
      </main>

      {/* Updated DetailModal with Items for Navigation */}
      <DetailModal
        item={selectedItem}
        items={displayItems}
        onClose={() => setSelectedItem(null)}
        onChange={(newItem) => setSelectedItem(newItem)}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
      {/* Edit Phase Modal */}
      {editingPhase && (
        <PhaseEditModal
          isOpen={!!editingPhase}
          phaseKey={editingPhase}
          initialData={phaseData[editingPhase]}
          onClose={() => setEditingPhase(null)}
          onSave={handlePhaseUpdate}
        />
      )}
    </div>
  );
}
