import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

const STEP = 260; // quanto a lista anda a cada clique na seta
const EDGE = 4; // folga para considerar que chegou ao começo/fim
const HOVER_SPEED = 80; // velocidade ao passar o mouse na seta, em pixels por segundo (menor = mais lento)
const HOVER_RAMP_MS = 350; // a rolagem começa devagar e leva esse tempo para chegar na velocidade máxima

function Arrow({ side, hovered, onPress, onHoverIn, onHoverOut }) {
  return (
    <Pressable
      style={[styles.arrow, side === 'left' ? styles.left : styles.right, hovered && styles.arrowHover]}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="button"
      accessibilityLabel={side === 'left' ? 'Rolar para a esquerda' : 'Rolar para a direita'}
    >
      <Text style={[styles.arrowText, hovered && styles.arrowTextHover]}>{side === 'left' ? '‹' : '›'}</Text>
    </Pressable>
  );
}

// Lista que rola para o lado. No celular, o dedo arrasta. No navegador o mouse não consegue
// arrastar, então aparecem setas ‹ › nas pontas (só quando ainda há o que rolar):
// passar o mouse sobre a seta faz a lista deslizar devagar; clicar pula um pedaço.
export default function HorizontalList({ children, contentContainerStyle }) {
  const scrollRef = useRef(null);
  const position = useRef({ x: 0, content: 0, view: 0 });
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hovering, setHovering] = useState(null); // 'left', 'right' ou null

  function refreshArrows() {
    const { x, content, view } = position.current;
    setCanLeft(x > EDGE);
    setCanRight(content - view - x > EDGE);
  }

  function scrollBy(delta) {
    const { x, content, view } = position.current;
    const target = Math.max(0, Math.min(x + delta, Math.max(0, content - view)));
    scrollRef.current?.scrollTo({ x: target, animated: true });
  }

  function clickArrow(delta) {
    setHovering(null); // para o deslizar do hover para não brigar com o pulo do clique
    scrollBy(delta);
  }

  // Enquanto o mouse está sobre a seta, anda um pouquinho a cada quadro da tela.
  useEffect(() => {
    if (!hovering) return undefined;
    const direction = hovering === 'right' ? 1 : -1;
    let frame = null;
    let startedAt = null;
    let last = null;
    let x = position.current.x;

    function step(now) {
      if (startedAt == null) {
        startedAt = now;
        last = now;
      }
      const speed = HOVER_SPEED * Math.min(1, (now - startedAt) / HOVER_RAMP_MS);
      const seconds = (now - last) / 1000;
      last = now;

      const { content, view } = position.current;
      const max = Math.max(0, content - view);
      x = Math.max(0, Math.min(x + direction * speed * seconds, max));
      scrollRef.current?.scrollTo({ x, animated: false });

      if ((direction > 0 && x >= max) || (direction < 0 && x <= 0)) {
        setHovering(null); // chegou na ponta
        return;
      }
      frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [hovering]);

  const showArrows = Platform.OS === 'web';

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        onScroll={(event) => {
          position.current.x = event.nativeEvent.contentOffset.x;
          refreshArrows();
        }}
        onLayout={(event) => {
          position.current.view = event.nativeEvent.layout.width;
          refreshArrows();
        }}
        onContentSizeChange={(width) => {
          position.current.content = width;
          refreshArrows();
        }}
      >
        {children}
      </ScrollView>

      {showArrows && canLeft ? (
        <Arrow
          side="left"
          hovered={hovering === 'left'}
          onPress={() => clickArrow(-STEP)}
          onHoverIn={() => setHovering('left')}
          onHoverOut={() => setHovering(null)}
        />
      ) : null}
      {showArrows && canRight ? (
        <Arrow
          side="right"
          hovered={hovering === 'right'}
          onPress={() => clickArrow(STEP)}
          onHoverIn={() => setHovering('right')}
          onHoverOut={() => setHovering(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -32,
    width: 34,
    height: 64,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  arrowHover: { backgroundColor: colors.primary, borderColor: colors.primary },
  left: { left: 8 },
  right: { right: 8 },
  arrowText: { color: colors.primary, fontSize: 26, lineHeight: 30, fontWeight: '700' },
  arrowTextHover: { color: colors.onPrimary },
});
