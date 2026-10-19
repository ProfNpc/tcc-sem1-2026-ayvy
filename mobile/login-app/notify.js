import { Alert, Platform } from 'react-native';

// Alert.alert NÃO funciona no navegador (não mostra nada). Estas funções escolhem o jeito certo em cada plataforma.

export function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// Pergunta com "Cancelar" e um botão de confirmação. Só chama onConfirm se a pessoa aceitar.
export function confirmAction(title, message, confirmLabel, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
