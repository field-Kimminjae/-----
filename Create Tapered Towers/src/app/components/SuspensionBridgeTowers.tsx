import { useEffect, useRef, useState } from 'react';

// ===== 1. 설정 및 타입 정의 (Configuration & Types) =====
interface BridgeConfig {
  // 캔버스 설정
  width: number;
  height: number;
  
  // 상판 (Deck) 설정
  deckLength: number;
  deckWidth: number;
  deckY: number; // 캔버스 기준 Y 위치 (보정 전)
  
  // 주탑 (Tower) 설정
  towerHeight: number;
  towerTopWidth: number;
  towerBottomWidth: number;
  
  // 케이블 (Cable) 설정
  mainCableSag: number; // 메인 케이블 처짐량
  hangerSpacing: number; // 행어 케이블 간격
  
  // 물리적 단순화 모델 설정
  maxDeflection: number; // 상판 최대 처짐량 (중앙)
}

// 초기 설정값
const INITIAL_CONFIG: BridgeConfig = {
  width: 1000,
  height: 600,
  deckLength: 800,
  deckWidth: 60,
  deckY: 600 / 2 - 60 / 2, // 중앙 배치
  towerHeight: 160, // 800 / 5
  towerTopWidth: 40,
  towerBottomWidth: 50,
  mainCableSag: 80,
  hangerSpacing: 60,
  maxDeflection: 30,
};

export function SuspensionBridgeTowers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<BridgeConfig>(INITIAL_CONFIG);

  // ===== 2. 그리기 로직 (Drawing Logic) =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 0. 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 계산된 위치 값들 (Derived Values)
    const deckX = (config.width - config.deckLength) / 2;
    const deckCenterY = config.deckY + config.deckWidth / 2;
    const tower1X = deckX + config.deckLength * 0.25;
    const tower2X = deckX + config.deckLength * 0.75;
    const tower1TopY = deckCenterY - config.towerHeight / 2;
    const tower1BottomY = deckCenterY + config.towerHeight / 2;

    // --- Helper Functions ---

    // 처짐 곡선 공식 (단순보의 처짐: 포물선 근사)
    const getDeckDeflection = (localX: number) => {
      // localX: 0 ~ deckLength
      const normalizedX = localX / config.deckLength; // 0 ~ 1
      return config.maxDeflection * 4 * normalizedX * (1 - normalizedX);
    };

    // 케이블 처짐 공식 (포물선)
    const getCableSag = (x: number) => {
      // x: tower1X ~ tower2X
      const cableSpan = tower2X - tower1X;
      const normalizedX = (x - tower1X) / cableSpan;
      return config.mainCableSag * 4 * normalizedX * (1 - normalizedX);
    };

    // --- Drawing Functions ---

    const drawBackground = () => {
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, config.width, config.height);
    };

    const drawGrid = () => {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let i = 0; i < config.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, config.height);
        ctx.stroke();
      }
      for (let i = 0; i < config.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(config.width, i);
        ctx.stroke();
      }
    };

    const drawCriticalZones = () => {
      // 1. 상판 중앙 (최대 굽힘 모멘트)
      const criticalZoneCenterX = config.width / 2;
      const criticalZoneWidth = 100;
      const centerDeflection = getDeckDeflection(config.deckLength / 2);
      
      const gradientDeck = ctx.createRadialGradient(
        criticalZoneCenterX, deckCenterY + centerDeflection, 0,
        criticalZoneCenterX, deckCenterY + centerDeflection, criticalZoneWidth
      );
      gradientDeck.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradientDeck.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = gradientDeck;
      ctx.fillRect(criticalZoneCenterX - criticalZoneWidth, config.deckY - 20, 
                   criticalZoneWidth * 2, config.deckWidth + 80);

      // 2. 주탑 하단부 (최대 압축 응력)
      const drawTowerStress = (x: number, y: number) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 60);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 60, y - 30, 120, 60);
      };
      drawTowerStress(tower1X, tower1BottomY);
      drawTowerStress(tower2X, tower1BottomY);
    };

    const drawCenterLine = () => {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, deckCenterY);
      ctx.lineTo(config.width, deckCenterY);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawDetailTowers = () => {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;

      const drawSingleTower = (x: number) => {
        ctx.beginPath();
        ctx.moveTo(x - config.towerTopWidth / 2, tower1TopY);
        ctx.lineTo(x + config.towerTopWidth / 2, tower1TopY);
        ctx.lineTo(x + config.towerBottomWidth / 2, tower1BottomY);
        ctx.lineTo(x - config.towerBottomWidth / 2, tower1BottomY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      drawSingleTower(tower1X);
      drawSingleTower(tower2X);
    };

    const drawDeck = () => {
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      // 상단 곡선
      ctx.moveTo(deckX, config.deckY);
      for (let x = 0; x <= config.deckLength; x += 10) {
        const deflection = getDeckDeflection(x);
        ctx.lineTo(deckX + x, config.deckY + deflection);
      }
      // 하단 곡선 (역방향)
      for (let x = config.deckLength; x >= 0; x -= 10) {
        const deflection = getDeckDeflection(x);
        ctx.lineTo(deckX + x, config.deckY + config.deckWidth + deflection);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    const drawInternalStress = () => {
        // 압축 (상판 상단)
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 2;
        
        for (let x = deckX + 60; x < deckX + config.deckLength - 60; x += 80) {
          const localX = x - deckX;
          const deflection = getDeckDeflection(localX);
          const y = config.deckY + deflection - 15;
          
          // 화살표 쌍 (압축: -> | <-)
          const drawArrow = (cx: number, cy: number, offset: number, direction: 'left' | 'right') => {
             // direction 'left': points left
             // direction 'right': points right
             ctx.beginPath();
             const startX = cx + offset;
             const endX = direction === 'left' ? startX - 15 : startX + 15;
             ctx.moveTo(startX, cy);
             ctx.lineTo(endX, cy);
             ctx.stroke();

             // head
             ctx.beginPath();
             ctx.moveTo(endX, cy);
             ctx.lineTo(endX + (direction === 'left' ? 5 : -5), cy - 4);
             ctx.lineTo(endX + (direction === 'left' ? 5 : -5), cy + 4);
             ctx.closePath();
             ctx.fill();
          };
          
          // Left part (points right)
          drawArrow(x, y, -20, 'right');
          // Right part (points left)
          drawArrow(x, y, 20, 'left');
        }

        // 인장 (상판 하단) (인장: <- | ->)
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = '#dc2626';
        for (let x = deckX + 60; x < deckX + config.deckLength - 60; x += 80) {
            const localX = x - deckX;
            const deflection = getDeckDeflection(localX);
            const y = config.deckY + config.deckWidth + deflection + 15;
            
             // Left part (points left)
             ctx.beginPath();
             ctx.moveTo(x - 20, y);
             ctx.lineTo(x - 5, y); // x-20 to x-5 ?? No, stick to simpler logic
             // Re-implement carefully based on original logic:
             // Original Left: moveTo(x-20), lineTo(x-5), stroke. Head at x-5? No.
             // Let's use standard arrow drawing for clarity.
             
             // Left Arrow (Pulling Left) <-
             ctx.beginPath();
             ctx.moveTo(x - 5, y);
             ctx.lineTo(x - 20, y);
             ctx.stroke();
             ctx.beginPath();
             ctx.moveTo(x - 20, y);
             ctx.lineTo(x - 15, y - 4);
             ctx.lineTo(x - 15, y + 4);
             ctx.fill();

             // Right Arrow (Pulling Right) ->
             ctx.beginPath();
             ctx.moveTo(x + 5, y);
             ctx.lineTo(x + 20, y);
             ctx.stroke();
             ctx.beginPath();
             ctx.moveTo(x + 20, y);
             ctx.lineTo(x + 15, y - 4);
             ctx.lineTo(x + 15, y + 4);
             ctx.fill();
        }
    };

    const drawCables = () => {
        // 1. Main Cable
        const drawMainCurve = (color: string, width: number) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(tower1X, tower1TopY);
            for (let x = tower1X; x <= tower2X; x += 5) {
                const sag = getCableSag(x);
                ctx.lineTo(x, tower1TopY + sag);
            }
            ctx.stroke();
        };
        drawMainCurve('rgba(250, 204, 21, 0.3)', 12); // Aura
        drawMainCurve('#374151', 4); // Main Wire

        // 2. Hanger Cables
        const hangerCablesList: Array<{x: number, y1: number, y2: number}> = [];
        for (let x = tower1X + config.hangerSpacing; x < tower2X; x += config.hangerSpacing) {
            const cableSagAtX = getCableSag(x);
            const cableY = tower1TopY + cableSagAtX;
            
            const localDeckX = x - deckX;
            const deckDeflection = getDeckDeflection(localDeckX);
            const deckTopY = config.deckY + deckDeflection;
            
            // Aura
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
            ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(x, cableY); ctx.lineTo(x, deckTopY); ctx.stroke();
            
            // Wire
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, cableY); ctx.lineTo(x, deckTopY); ctx.stroke();

            hangerCablesList.push({x, y1: cableY, y2: deckTopY});
        }
        return hangerCablesList;
    };

    const drawSupports = () => {
         // Roller Support (Triangle)
         const drawRoller = (x: number, y: number) => {
            ctx.fillStyle = '#0ea5e9';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 15, y + 20);
            ctx.lineTo(x + 15, y + 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Rollers
            ctx.fillStyle = '#0ea5e9';
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.arc(x + i * 10, y + 25, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
            // Ground
            ctx.strokeStyle = '#0284c7';
            ctx.beginPath(); ctx.moveTo(x - 20, y + 30); ctx.lineTo(x + 20, y + 30); ctx.stroke();
         };

         // Pin Support (Circle)
         const drawPin = (x: number, y: number) => {
             ctx.fillStyle = '#8b5cf6';
             ctx.strokeStyle = '#7c3aed';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(x, y, 8, 0, 2 * Math.PI);
             ctx.fill();
             ctx.stroke();
             // Cross
             ctx.strokeStyle = '#ffffff';
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             ctx.moveTo(x-5, y); ctx.lineTo(x+5, y);
             ctx.moveTo(x, y-5); ctx.lineTo(x, y+5);
             ctx.stroke();
         };

         const leftDef = getDeckDeflection(0);
         const rightDef = getDeckDeflection(config.deckLength);
         drawRoller(deckX, config.deckY + config.deckWidth + leftDef + 5);
         drawRoller(deckX + config.deckLength, config.deckY + config.deckWidth + rightDef + 5);

         const t1Def = getDeckDeflection(config.deckLength * 0.25);
         const t2Def = getDeckDeflection(config.deckLength * 0.75);
         drawPin(tower1X, deckCenterY + t1Def);
         drawPin(tower2X, deckCenterY + t2Def);
    };

    const drawDistributedLoad = () => {
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = '#dc2626';
        ctx.lineWidth = 1.5;
        const arrowSpacing = 40;
        const arrowLength = 30;

        for (let x = deckX + 20; x < deckX + config.deckLength; x += arrowSpacing) {
            const localX = x - deckX;
            const deflection = getDeckDeflection(localX);
            // Arrow
            ctx.beginPath();
            ctx.moveTo(x, config.deckY + deflection - arrowLength);
            ctx.lineTo(x, config.deckY + deflection);
            ctx.stroke();
            // Arrow Head
            ctx.beginPath();
            ctx.moveTo(x, config.deckY + deflection);
            ctx.lineTo(x - 4, config.deckY + deflection - 8);
            ctx.lineTo(x + 4, config.deckY + deflection - 8);
            ctx.closePath();
            ctx.fill();
        }
    };

    const drawMohrCircle = () => {
        const cx = config.width / 2 + 180;
        const cy = deckCenterY - 80;
        const r = 40;

        // Box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - 65, cy - 65, 130, 130);
        ctx.strokeRect(cx - 65, cy - 65, 130, 130);

        // Axis
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 55, cy); ctx.lineTo(cx + 55, cy); ctx.stroke(); // X
        ctx.beginPath(); ctx.moveTo(cx, cy - 55); ctx.lineTo(cx, cy + 55); ctx.stroke(); // Y

        // Circle
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();

        // Points
        const angle = Math.PI / 4;
        const px = cx + r * Math.cos(angle);
        const py = cy - r * Math.sin(angle);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(px, py, 4, 0, 2*Math.PI); ctx.fill();

        ctx.fillStyle = '#059669';
        ctx.beginPath(); ctx.arc(cx+r, cy, 4, 0, 2*Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(cx-r, cy, 4, 0, 2*Math.PI); ctx.fill();

        // Titles
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Mohr's Circle", cx, cy - 70);
    };

    const drawLabels = () => {
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        
        // Critical Zones
        const centerDef = getDeckDeflection(config.deckLength/2);
        ctx.font = 'bold 12px sans-serif'; 
        ctx.fillStyle = '#ef4444';
        ctx.fillText('Critical Zone', config.width/2, deckCenterY + centerDef + 60);

        // Deflection Value
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`처짐: ${config.maxDeflection}mm`, config.width/2 + 100, deckCenterY + centerDef);
    };
    
    // --- Execution Order ---
    drawBackground();
    drawGrid();
    drawCriticalZones();
    drawCenterLine();
    drawDeck(); // 상판
    drawInternalStress(); // 상판 내부 응력
    drawDetailTowers(); // 주탑
    const hangers = drawCables(); // 케이블
    drawSupports(); // 지점
    drawDistributedLoad(); // 하중
    drawMohrCircle(); // 모어의 원
    drawLabels(); // 텍스트 레이블

  }, [config]); // config가 바뀌면 다시 그림

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">현수교 구조 해석도</h1>
        <p className="text-gray-600">처짐 곡선, 응력 분포, 모어의 원 및 위험 구간 시각화</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
      />
      
      {/* 정보 패널 */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 max-w-3xl w-full">
        <h3 className="font-bold text-lg mb-2">구조 설계 사양</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-1">주탑 및 상판 (Configured)</h4>
            <ul className="space-y-1 text-sm">
              <li>• 주탑 높이: {config.towerHeight}</li>
              <li>• 상판 길이: {config.deckLength}</li>
              <li>• 최대 처짐량: {config.maxDeflection}mm</li>
              <li>• 처짐 곡선: 단순보 처짐 공식 적용</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">케이블 시스템</h4>
            <ul className="space-y-1 text-sm">
              <li>• 메인 케이블: 포물선 형태 (처짐 {config.mainCableSag}mm)</li>
              <li>• 행어 케이블 간격: {config.hangerSpacing}mm</li>
              <li>• 탄성 에너지: 케이블 내부 저장</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}