import { useEffect, useRef } from 'react';

export function SuspensionBridgeTowers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 상판(Deck) 설정
    const deckLength = 800; // 상판 길이
    const deckWidth = 60; // 상판 너비
    const deckX = (canvas.width - deckLength) / 2;
    const deckY = canvas.height / 2 - deckWidth / 2;
    
    // 처짐량 (deflection) - 케이블 지지로 인해 보정됨
    const maxDeflection = 30; // 중앙부 최대 처짐량 (케이블 지지로 감소)
    const cableSag = 80; // 메인 케이블의 처짐량

    // 주탑(Tower) 설정
    const towerHeight = deckLength / 5; // 상판 길이의 1/5
    const towerTopWidth = 40; // 주탑 상단 너비
    const towerBottomWidth = 50; // 주탑 하단 너비 (테이퍼드 효과)
    
    // 주탑 위치 (상판의 1/4, 3/4 지점)
    const tower1X = deckX + deckLength * 0.25;
    const tower2X = deckX + deckLength * 0.75;
    
    // 주탑의 도심이 상판의 중심축과 일치
    const deckCenterY = deckY + deckWidth / 2;
    
    // 처짐 곡선 계산 함수 (단순보의 처짐)
    const getDeflection = (x: number) => {
      // x는 0에서 deckLength까지
      // 포물선 형태: y = a * x * (L - x)
      // 중앙에서 최대 처짐
      const normalizedX = x / deckLength; // 0 to 1
      return maxDeflection * 4 * normalizedX * (1 - normalizedX);
    };

    // 배경 그리기
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 그리기
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // ===== 위험 구간 강조 (Critical Zone) =====
    // 상판 중앙부 (최대 굽힘 모멘트)
    const criticalZoneCenterX = canvas.width / 2;
    const criticalZoneWidth = 100;
    const centerDeflection = getDeflection(deckLength / 2);
    const gradientDeck = ctx.createRadialGradient(
      criticalZoneCenterX, deckCenterY + centerDeflection, 0,
      criticalZoneCenterX, deckCenterY + centerDeflection, criticalZoneWidth
    );
    gradientDeck.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    gradientDeck.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradientDeck;
    ctx.fillRect(criticalZoneCenterX - criticalZoneWidth, deckY - 20, 
                 criticalZoneWidth * 2, deckWidth + 80);

    // 주탑 하단부 (최대 압축 응력)
    const tower1TopY = deckCenterY - towerHeight / 2;
    const tower1BottomY = deckCenterY + towerHeight / 2;
    
    const gradientTower1 = ctx.createRadialGradient(
      tower1X, tower1BottomY, 0,
      tower1X, tower1BottomY, 60
    );
    gradientTower1.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    gradientTower1.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradientTower1;
    ctx.fillRect(tower1X - 60, tower1BottomY - 30, 120, 60);

    const gradientTower2 = ctx.createRadialGradient(
      tower2X, tower1BottomY, 0,
      tower2X, tower1BottomY, 60
    );
    gradientTower2.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    gradientTower2.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradientTower2;
    ctx.fillRect(tower2X - 60, tower1BottomY - 30, 120, 60);

    // 중심축 그리기 (점선 - 처짐 전 원래 위치)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(0, deckCenterY);
    ctx.lineTo(canvas.width, deckCenterY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 주탑 1 그리기 (테이퍼드 사각 기둥)
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    
    // 주탑 1
    ctx.beginPath();
    ctx.moveTo(tower1X - towerTopWidth / 2, tower1TopY);
    ctx.lineTo(tower1X + towerTopWidth / 2, tower1TopY);
    ctx.lineTo(tower1X + towerBottomWidth / 2, tower1BottomY);
    ctx.lineTo(tower1X - towerBottomWidth / 2, tower1BottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 주탑 2
    ctx.beginPath();
    ctx.moveTo(tower2X - towerTopWidth / 2, tower1TopY);
    ctx.lineTo(tower2X + towerTopWidth / 2, tower1TopY);
    ctx.lineTo(tower2X + towerBottomWidth / 2, tower1BottomY);
    ctx.lineTo(tower2X - towerBottomWidth / 2, tower1BottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ===== 메인 케이블 (Main Cable) =====
    // 케이블의 처짐 곡선 (주탑 사이)
    const cableSpan = tower2X - tower1X;
    const getCableSag = (x: number) => {
      // x는 tower1X에서 tower2X까지
      // 포물선 형태로 아래로 처짐
      const normalizedX = (x - tower1X) / cableSpan; // 0 to 1
      return cableSag * 4 * normalizedX * (1 - normalizedX);
    };
    
    // 노란색 아우라 (탄성 에너지)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(tower1X, tower1TopY);
    for (let x = tower1X; x <= tower2X; x += 5) {
      const sag = getCableSag(x);
      ctx.lineTo(x, tower1TopY + sag);
    }
    ctx.stroke();
    
    // 메인 케이블 본체
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tower1X, tower1TopY);
    for (let x = tower1X; x <= tower2X; x += 5) {
      const sag = getCableSag(x);
      ctx.lineTo(x, tower1TopY + sag);
    }
    ctx.stroke();
    
    // ===== 행어 케이블 (Hanger Cables) =====
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    
    const hangerSpacing = 60;
    const hangerCables: Array<{x: number, y1: number, y2: number}> = [];
    
    for (let x = tower1X + hangerSpacing; x < tower2X; x += hangerSpacing) {
      const cableSagAtX = getCableSag(x);
      const cableY = tower1TopY + cableSagAtX;
      
      const localDeckX = x - deckX;
      const deckDeflection = getDeflection(localDeckX);
      const deckTopY = deckY + deckDeflection;
      
      // 노란색 아우라 (행어 케이블)
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x, cableY);
      ctx.lineTo(x, deckTopY);
      ctx.stroke();
      
      // 행어 케이블 본체
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, cableY);
      ctx.lineTo(x, deckTopY);
      ctx.stroke();
      
      hangerCables.push({x, y1: cableY, y2: deckTopY});
    }
    
    // ===== 케이블 인장 응력 표시 =====
    // 메인 케이블 양 끝 인장 응력
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    
    // 주탑 1에서 바깥쪽으로
    const tensionArrowLength = 35;
    ctx.beginPath();
    ctx.moveTo(tower1X, tower1TopY);
    ctx.lineTo(tower1X - tensionArrowLength, tower1TopY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tower1X - tensionArrowLength, tower1TopY);
    ctx.lineTo(tower1X - tensionArrowLength + 8, tower1TopY - 5);
    ctx.lineTo(tower1X - tensionArrowLength + 8, tower1TopY + 5);
    ctx.closePath();
    ctx.fill();
    
    // 주탑 2에서 바깥쪽으로
    ctx.beginPath();
    ctx.moveTo(tower2X, tower1TopY);
    ctx.lineTo(tower2X + tensionArrowLength, tower1TopY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tower2X + tensionArrowLength, tower1TopY);
    ctx.lineTo(tower2X + tensionArrowLength - 8, tower1TopY - 5);
    ctx.lineTo(tower2X + tensionArrowLength - 8, tower1TopY + 5);
    ctx.closePath();
    ctx.fill();
    
    // 인장 응력 레이블
    ctx.font = 'italic bold 13px serif';
    ctx.textAlign = 'center';
    ctx.fillText('σ', tower1X - tensionArrowLength - 15, tower1TopY - 8);
    ctx.font = '10px sans-serif';
    ctx.fillText('인장', tower1X - tensionArrowLength - 15, tower1TopY + 5);
    
    ctx.font = 'italic bold 13px serif';
    ctx.fillText('σ', tower2X + tensionArrowLength + 15, tower1TopY - 8);
    ctx.font = '10px sans-serif';
    ctx.fillText('인장', tower2X + tensionArrowLength + 15, tower1TopY + 5);
    
    // 행어 케이블 인장 (몇 개 선택하여 표시)
    for (let i = 1; i < hangerCables.length; i += 2) {
      const hanger = hangerCables[i];
      const midY = (hanger.y1 + hanger.y2) / 2;
      
      // 위쪽 화살표
      ctx.strokeStyle = '#dc2626';
      ctx.fillStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hanger.x + 8, midY - 15);
      ctx.lineTo(hanger.x + 8, midY - 25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hanger.x + 8, midY - 25);
      ctx.lineTo(hanger.x + 5, midY - 18);
      ctx.lineTo(hanger.x + 11, midY - 18);
      ctx.closePath();
      ctx.fill();
      
      // 아래쪽 화살표
      ctx.beginPath();
      ctx.moveTo(hanger.x + 8, midY + 15);
      ctx.lineTo(hanger.x + 8, midY + 25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hanger.x + 8, midY + 25);
      ctx.lineTo(hanger.x + 5, midY + 18);
      ctx.lineTo(hanger.x + 11, midY + 18);
      ctx.closePath();
      ctx.fill();
    }
    
    // 탄성 에너지 레이블
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const midCableX = (tower1X + tower2X) / 2;
    const midCableSag = getCableSag(midCableX);
    ctx.fillText('⚡ 탄성 에너지 저장 중', midCableX, tower1TopY + midCableSag - 15);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#ca8a04';
    ctx.fillText('(케이블 인장 상태)', midCableX, tower1TopY + midCableSag - 3);

    // ===== 상판을 처짐 곡선으로 그리기 =====
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    
    // 상판 상단 곡선
    ctx.beginPath();
    ctx.moveTo(deckX, deckY);
    for (let x = 0; x <= deckLength; x += 10) {
      const deflection = getDeflection(x);
      ctx.lineTo(deckX + x, deckY + deflection);
    }
    // 상판 하단 곡선 (역순)
    for (let x = deckLength; x >= 0; x -= 10) {
      const deflection = getDeflection(x);
      ctx.lineTo(deckX + x, deckY + deckWidth + deflection);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ===== 인장과 압축 표시 =====
    // 압축 (상판 상단) - 파란색 화살표가 서로 마주봄
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    for (let x = deckX + 60; x < deckX + deckLength - 60; x += 80) {
      const localX = x - deckX;
      const deflection = getDeflection(localX);
      const y = deckY + deflection - 15;
      
      // 왼쪽 화살표 (오른쪽을 향함)
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x - 5, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x - 10, y - 4);
      ctx.lineTo(x - 10, y + 4);
      ctx.closePath();
      ctx.fill();
      
      // 오른쪽 화살표 (왼쪽을 향함)
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x + 5, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 5, y);
      ctx.lineTo(x + 10, y - 4);
      ctx.lineTo(x + 10, y + 4);
      ctx.closePath();
      ctx.fill();
    }

    // 압축 레이블
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('압축', deckX + deckLength / 2 - 100, deckY - 20);

    // 인장 (상판 하단) - 빨간색 화살표가 서로 당김
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 2;
    
    for (let x = deckX + 60; x < deckX + deckLength - 60; x += 80) {
      const localX = x - deckX;
      const deflection = getDeflection(localX);
      const y = deckY + deckWidth + deflection + 15;
      
      // 왼쪽 화살표 (왼쪽으로 당김)
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x - 5, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x - 15, y - 4);
      ctx.lineTo(x - 15, y + 4);
      ctx.closePath();
      ctx.fill();
      
      // 오른쪽 화살표 (오른쪽으로 당김)
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x + 5, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x + 15, y - 4);
      ctx.lineTo(x + 15, y + 4);
      ctx.closePath();
      ctx.fill();
    }

    // 인장 레이블
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('인장', deckX + deckLength / 2 - 100, deckY + deckWidth + centerDeflection + 35);

    // ===== 지점 표시 =====
    // Helper function: 삼각형 그리기 (이동 지점 - Roller Support)
    const drawRollerSupport = (x: number, y: number) => {
      // 삼각형
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
      
      // 롤러 (작은 원들)
      ctx.fillStyle = '#0ea5e9';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(x + i * 10, y + 25, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // 바닥선
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 20, y + 30);
      ctx.lineTo(x + 20, y + 30);
      ctx.stroke();
    };

    // Helper function: 핀 지점 (회전 지점 - Pin Support)
    const drawPinSupport = (x: number, y: number) => {
      ctx.fillStyle = '#8b5cf6';
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // 내부 십자선
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
      ctx.stroke();
    };

    // 이동 지점 - 상판 양 끝단 아래
    const leftDeflection = getDeflection(0);
    const rightDeflection = getDeflection(deckLength);
    drawRollerSupport(deckX, deckY + deckWidth + leftDeflection + 5);
    drawRollerSupport(deckX + deckLength, deckY + deckWidth + rightDeflection + 5);

    // 회전 지점 - 주탑과 상판 교차점
    const tower1Deflection = getDeflection(deckLength * 0.25);
    const tower2Deflection = getDeflection(deckLength * 0.75);
    drawPinSupport(tower1X, deckCenterY + tower1Deflection);
    drawPinSupport(tower2X, deckCenterY + tower2Deflection);

    // ===== 하중 분포 (등분포 하중) =====
    // 상판 전체에 걸쳐 아래 방향 화살표
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    
    const arrowSpacing = 40;
    const arrowLength = 30;
    for (let x = deckX + 20; x < deckX + deckLength; x += arrowSpacing) {
      const localX = x - deckX;
      const deflection = getDeflection(localX);
      
      // 화살표 선
      ctx.beginPath();
      ctx.moveTo(x, deckY + deflection - arrowLength);
      ctx.lineTo(x, deckY + deflection);
      ctx.stroke();
      
      // 화살표 머리
      ctx.beginPath();
      ctx.moveTo(x, deckY + deflection);
      ctx.lineTo(x - 4, deckY + deflection - 8);
      ctx.lineTo(x + 4, deckY + deflection - 8);
      ctx.closePath();
      ctx.fill();
    }

    // 등분포 하중 레이블
    ctx.fillStyle = '#dc2626';
    ctx.font = 'italic bold 16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('w', canvas.width / 2, deckY + centerDeflection - arrowLength - 20);
    ctx.font = '12px sans-serif';
    ctx.fillText('(등분포 하중)', canvas.width / 2, deckY + centerDeflection - arrowLength - 5);

    // ===== 케이블 장력 (주탑 꼭대기) =====
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    
    // 주탑 1 케이블 장력 (비스듬히)
    const cableAngle = Math.PI / 6; // 30도
    const cableLength = 50;
    const cable1EndX = tower1X - cableLength * Math.cos(cableAngle);
    const cable1EndY = tower1TopY - cableLength * Math.sin(cableAngle);
    
    ctx.beginPath();
    ctx.moveTo(tower1X, tower1TopY);
    ctx.lineTo(cable1EndX, cable1EndY);
    ctx.stroke();
    
    // 화살표 머리
    ctx.save();
    ctx.translate(cable1EndX, cable1EndY);
    ctx.rotate(-cableAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // 주탑 2 케이블 장력
    const cable2EndX = tower2X + cableLength * Math.cos(cableAngle);
    const cable2EndY = tower1TopY - cableLength * Math.sin(cableAngle);
    
    ctx.beginPath();
    ctx.moveTo(tower2X, tower1TopY);
    ctx.lineTo(cable2EndX, cable2EndY);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(cable2EndX, cable2EndY);
    ctx.rotate(Math.PI + cableAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 케이블 장력 레이블
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('케이블 장력', tower1X - 50, tower1TopY - 50);
    ctx.fillText('케이블 장력', tower2X + 50, tower1TopY - 50);

    // ===== 지점 반력 =====
    // Helper function: 반력 화살표 그리기
    const drawReactionForce = (x: number, y: number, label: string) => {
      ctx.strokeStyle = '#10b981';
      ctx.fillStyle = '#10b981';
      ctx.lineWidth = 3;
      
      const reactionLength = 50;
      
      // 화살표 선
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - reactionLength);
      ctx.stroke();
      
      // 화살표 머리
      ctx.beginPath();
      ctx.moveTo(x, y - reactionLength);
      ctx.lineTo(x - 6, y - reactionLength + 12);
      ctx.lineTo(x + 6, y - reactionLength + 12);
      ctx.closePath();
      ctx.fill();
      
      // 레이블
      ctx.font = 'italic bold 16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('R', x, y - reactionLength - 15);
      ctx.font = '10px sans-serif';
      ctx.fillText(label, x, y - reactionLength - 2);
    };

    // 양 끝단 반력
    drawReactionForce(deckX, deckY + deckWidth + leftDeflection + 35, '1');
    drawReactionForce(deckX + deckLength, deckY + deckWidth + rightDeflection + 35, '2');

    // ===== 모어의 원 (Mohr's Circle) =====
    const mohrCenterX = canvas.width / 2 + 180;
    const mohrCenterY = deckCenterY - 80;
    const mohrRadius = 40;
    
    // 배경 박스
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.fillRect(mohrCenterX - 65, mohrCenterY - 65, 130, 130);
    ctx.strokeRect(mohrCenterX - 65, mohrCenterY - 65, 130, 130);
    
    // 축 그리기
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    
    // σ 축 (가로)
    ctx.beginPath();
    ctx.moveTo(mohrCenterX - 55, mohrCenterY);
    ctx.lineTo(mohrCenterX + 55, mohrCenterY);
    ctx.stroke();
    
    // τ 축 (세로)
    ctx.beginPath();
    ctx.moveTo(mohrCenterX, mohrCenterY - 55);
    ctx.lineTo(mohrCenterX, mohrCenterY + 55);
    ctx.stroke();
    
    // 모어의 원
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mohrCenterX, mohrCenterY, mohrRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 현재 응력 상태 점
    const stressPointAngle = Math.PI / 4; // 45도
    const stressPointX = mohrCenterX + mohrRadius * Math.cos(stressPointAngle);
    const stressPointY = mohrCenterY - mohrRadius * Math.sin(stressPointAngle);
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(stressPointX, stressPointY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // 주응력 표시
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(mohrCenterX + mohrRadius, mohrCenterY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mohrCenterX - mohrRadius, mohrCenterY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // 축 레이블
    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 12px serif';
    ctx.textAlign = 'center';
    ctx.fillText('σ', mohrCenterX + 55, mohrCenterY + 15);
    ctx.fillText('τ', mohrCenterX + 10, mohrCenterY - 50);
    
    // 타이틀
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText("Mohr's Circle", mohrCenterX, mohrCenterY - 70);
    ctx.font = '9px sans-serif';
    ctx.fillText('(응력 상태)', mohrCenterX, mohrCenterY + 75);

    // ===== Critical Zone 레이블 =====
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Critical Zone', canvas.width / 2, deckCenterY + centerDeflection + 60);
    ctx.font = '10px sans-serif';
    ctx.fillText('(최대 굽힘 모멘트)', canvas.width / 2, deckCenterY + centerDeflection + 75);
    
    ctx.fillText('Critical Zone', tower1X, tower1BottomY + 45);
    ctx.font = '10px sans-serif';
    ctx.fillText('(최대 압축 응력)', tower1X, tower1BottomY + 58);
    
    // 처짐 표시
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`처짐: ${maxDeflection}mm`, canvas.width / 2 + 100, deckCenterY + centerDeflection);

    // ===== 범례 =====
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    
    let legendY = 30;
    const legendX = 20;
    
    // 이동 지점
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX - 8, legendY + 10);
    ctx.lineTo(legendX + 8, legendY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillText('이동 지점 (Roller)', legendX + 15, legendY + 8);
    
    legendY += 18;
    // 회전 지점
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    ctx.arc(legendX, legendY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillText('회전 지점 (Pin)', legendX + 15, legendY + 4);
    
    legendY += 18;
    // 등분포 하중
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY - 10);
    ctx.lineTo(legendX, legendY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX - 3, legendY - 6);
    ctx.lineTo(legendX + 3, legendY - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillText('등분포 하중 (w)', legendX + 15, legendY);
    
    legendY += 18;
    // 압축
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(legendX - 8, legendY);
    ctx.lineTo(legendX + 8, legendY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legendX - 8, legendY);
    ctx.lineTo(legendX - 5, legendY - 3);
    ctx.lineTo(legendX - 5, legendY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(legendX + 8, legendY);
    ctx.lineTo(legendX + 5, legendY - 3);
    ctx.lineTo(legendX + 5, legendY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillText('압축 응력', legendX + 15, legendY + 4);
    
    legendY += 18;
    // 인장
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(legendX - 8, legendY);
    ctx.lineTo(legendX + 8, legendY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legendX - 8, legendY);
    ctx.lineTo(legendX - 11, legendY - 3);
    ctx.lineTo(legendX - 11, legendY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(legendX + 8, legendY);
    ctx.lineTo(legendX + 11, legendY - 3);
    ctx.lineTo(legendX + 11, legendY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillText('인장 응력', legendX + 15, legendY + 4);

  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">현수교 구조 해석도</h1>
        <p className="text-gray-600">처짐 곡선, 응력 분포, 모어의 원 및 위험 구간 시각화</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
      />
      
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 max-w-3xl w-full">
        <h3 className="font-bold text-lg mb-2">구조 설계 사양</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-1">주탑 및 상판</h4>
            <ul className="space-y-1 text-sm">
              <li>• 주탑 높이: 상판 길이의 1/5 = 160</li>
              <li>• 테이퍼드 형상 (상단 40 → 하단 50)</li>
              <li>• 최대 처짐량: 30mm (케이블 지지로 보정)</li>
              <li>• 처짐 곡선: 단순보 처짐 공식 적용</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-1">케이블 시스템</h4>
            <ul className="space-y-1 text-sm">
              <li>• 메인 케이블: 포물선 형태 (처짐 80mm)</li>
              <li>• 행어 케이블: 메인 → 상판 수직 연결</li>
              <li>• 인장 부재: 순수 인장 응력(σ<sub>인장</sub>)</li>
              <li>• 탄성 에너지: 케이블 내부 저장</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-300">
          <h4 className="font-semibold mb-1">응력 분포</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>• 상판 상단: 압축 응력 (파란색)</div>
            <div>• 상판 하단: 인장 응력 (빨간색)</div>
            <div>• 케이블: 순수 인장 (빨간 화살표)</div>
            <div>• Mohr's Circle: 응력 상태 표현</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-300">
          <h4 className="font-semibold mb-1 text-red-700">Critical Zones (위험 구간)</h4>
          <ul className="space-y-1 text-sm">
            <li>• <strong>상판 중앙부:</strong> 최대 굽힘 모멘트 발생</li>
            <li>• <strong>주탑 하단부:</strong> 최대 압축 응력 발생</li>
          </ul>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-300 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-700">현재 설계 안전율 (f<sub>s</sub>): 3.5</p>
              <p className="text-sm text-gray-600">(허용 응력 기준 만족)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}