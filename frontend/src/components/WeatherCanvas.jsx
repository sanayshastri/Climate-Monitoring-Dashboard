import { useEffect, useRef } from 'react';

export default function WeatherCanvas({ condition = 'thunderstorm', temp = 29 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle System Initialization
    const rainParticles = [];
    const maxRain = 220;
    for (let i = 0; i < maxRain; i++) {
      rainParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 25 + 15,
        speed: Math.random() * 14 + 10,
        opacity: Math.random() * 0.4 + 0.2,
        thickness: Math.random() * 1.5 + 0.5,
      });
    }

    const cloudParticles = [];
    for (let i = 0; i < 6; i++) {
      cloudParticles.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.4),
        radius: Math.random() * 180 + 120,
        speed: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }

    let lightningOpacity = 0;
    let nextLightningFrame = 0;

    let currRGBTop = [7, 11, 20];
    let currRGBMid = [15, 23, 42];
    let currRGBBot = [9, 13, 22];

    const getTargetGradientRGB = (temperature, cond) => {
      // 1. Extreme Heat (strictly > 35°C) - Fiery Amber & Copper dome
      if (temperature > 35) {
        return {
          top: [69, 26, 3], // deep amber
          mid: [124, 45, 18], // crimson ember
          bot: [24, 14, 4], // dark copper
        };
      }

      // 2. Warm (26°C - 35°C)
      if (temperature >= 26 && temperature <= 35) {
        if (cond === 'sunny' || cond === 'cloudy') {
          return {
            top: [30, 27, 75], // deep violet indigo
            mid: [30, 58, 138], // oceanic blue
            bot: [15, 23, 42], // navy slate
          };
        }
      }

      // 3. Cool / Moderate (18°C - 25°C)
      if (temperature >= 18 && temperature < 26) {
        if (cond === 'sunny' || cond === 'cloudy' || cond === 'drizzle') {
          return {
            top: [15, 43, 72], // deep sapphire
            mid: [30, 58, 138], // oceanic blue
            bot: [9, 13, 22], // slate midnight
          };
        }
      }

      // 4. Cold (< 18°C)
      if (temperature < 18) {
        return {
          top: [3, 43, 67], // glacial cyan
          mid: [7, 89, 133], // ice blue
          bot: [5, 14, 26], // dark ocean
        };
      }

      // Fallbacks
      if (cond === 'thunderstorm') {
        return {
          top: [7, 11, 20],
          mid: [15, 23, 42],
          bot: [9, 13, 22],
        };
      } else if (cond === 'rain') {
        return {
          top: [12, 21, 39],
          mid: [30, 41, 59],
          bot: [15, 23, 42],
        };
      }

      return {
        top: [15, 23, 42],
        mid: [30, 41, 59],
        bot: [9, 13, 22],
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const targetRGB = getTargetGradientRGB(temp, condition);
      const lerpFactor = 0.04;

      for (let i = 0; i < 3; i++) {
        currRGBTop[i] += (targetRGB.top[i] - currRGBTop[i]) * lerpFactor;
        currRGBMid[i] += (targetRGB.mid[i] - currRGBMid[i]) * lerpFactor;
        currRGBBot[i] += (targetRGB.bot[i] - currRGBBot[i]) * lerpFactor;
      }

      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(
        0,
        `rgb(${Math.round(currRGBTop[0])}, ${Math.round(currRGBTop[1])}, ${Math.round(currRGBTop[2])})`
      );
      grad.addColorStop(
        0.5,
        `rgb(${Math.round(currRGBMid[0])}, ${Math.round(currRGBMid[1])}, ${Math.round(currRGBMid[2])})`
      );
      grad.addColorStop(
        1,
        `rgb(${Math.round(currRGBBot[0])}, ${Math.round(currRGBBot[1])}, ${Math.round(currRGBBot[2])})`
      );

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render Sun Rays if sunny
      if (condition === 'sunny') {
        ctx.save();
        const rayColor1 =
          temp >= 33 ? 'rgba(249, 115, 22, 0.08)' : 'rgba(251, 191, 36, 0.04)';
        const rayColor2 =
          temp >= 33 ? 'rgba(239, 68, 68, 0.04)' : 'rgba(251, 191, 36, 0.02)';

        ctx.fillStyle = rayColor1;
        ctx.beginPath();
        ctx.arc(width * 0.8, 0, 450, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = rayColor2;
        ctx.beginPath();
        ctx.arc(width * 0.8, 0, 700, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      cloudParticles.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        c.x += c.speed;
        if (c.x - c.radius > width) c.x = -c.radius;
      });

      // Render Rain / Drizzle / Thunderstorm
      if (
        condition === 'rain' ||
        condition === 'thunderstorm' ||
        condition === 'drizzle'
      ) {
        ctx.lineCap = 'round';
        const densityMultiplier =
          condition === 'drizzle'
            ? 0.3
            : condition === 'thunderstorm'
            ? 1.0
            : 0.7;
        const speedMult = condition === 'drizzle' ? 0.5 : 1.0;
        const activeCount = Math.floor(maxRain * densityMultiplier);

        for (let i = 0; i < activeCount; i++) {
          const p = rainParticles[i];
          ctx.lineWidth = p.thickness;
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + p.length);
          ctx.stroke();

          p.y += p.speed * speedMult;
          p.x -= 1;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        }
      }

      // Lightning Flashes
      if (condition === 'thunderstorm') {
        nextLightningFrame++;
        if (nextLightningFrame % 280 === 0 && Math.random() > 0.3) {
          lightningOpacity = 0.45;
        }
        if (lightningOpacity > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningOpacity})`;
          ctx.fillRect(0, 0, width, height);
          lightningOpacity -= 0.03;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [condition, temp]);

  return <canvas ref={canvasRef} id="weather-canvas" />;
}
