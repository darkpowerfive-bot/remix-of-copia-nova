# 🔥 Configuração Firebase

Este diretório contém os arquivos de configuração inicial para migrar seu projeto para Firebase.

## 📁 Estrutura de Arquivos

```
docs/firebase-config/
├── firebase.ts          → Configuração principal do Firebase
├── useAuth.tsx          → Hook de autenticação (login, registro, Google)
├── useFirestore.ts      → Hooks para operações no Firestore
├── useStorage.ts        → Hook para upload/download de arquivos
├── ProtectedRoute.tsx   → Componente de rota protegida
├── env.example          → Exemplo de variáveis de ambiente
└── README.md            → Este arquivo
```

## 🚀 Como Usar

### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Siga o assistente de criação
4. Ative os serviços necessários:
   - **Authentication** → Email/Senha e Google
   - **Firestore Database** → Modo produção
   - **Storage** → Para arquivos

### 2. Configurar Credenciais

1. No Firebase Console, vá em **Project Settings** → **General**
2. Em "Your apps", clique no ícone da Web (`</>`)
3. Registre seu app e copie as credenciais
4. Crie o arquivo `.env` baseado no `env.example`

### 3. Instalar Dependências

```bash
npm install firebase
# ou
yarn add firebase
# ou
bun add firebase
```

### 4. Copiar Arquivos

Copie os arquivos para seu novo projeto:

```bash
# Estrutura sugerida
src/
├── lib/
│   └── firebase.ts           # Copiar firebase.ts
├── hooks/
│   ├── useAuth.tsx           # Copiar useAuth.tsx
│   ├── useFirestore.ts       # Copiar useFirestore.ts
│   └── useStorage.ts         # Copiar useStorage.ts
└── components/
    └── auth/
        └── ProtectedRoute.tsx # Copiar ProtectedRoute.tsx
```

### 5. Configurar AuthProvider

No seu `App.tsx` ou `main.tsx`:

```tsx
import { AuthProvider } from '@/hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* Suas rotas aqui */}
    </AuthProvider>
  );
}
```

### 6. Usar Rotas Protegidas

```tsx
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';

<Routes>
  {/* Rota pública (só para não logados) */}
  <Route path="/auth" element={
    <PublicRoute>
      <AuthPage />
    </PublicRoute>
  } />

  {/* Rota protegida */}
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

## 📝 Exemplos de Uso

### Autenticação

```tsx
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const { signIn, signInWithGoogle, loading } = useAuth();

  const handleLogin = async () => {
    await signIn('email@example.com', 'password123');
  };

  return (
    <div>
      <button onClick={handleLogin}>Entrar com Email</button>
      <button onClick={signInWithGoogle}>Entrar com Google</button>
    </div>
  );
}
```

### Firestore

```tsx
import { useCollection, createDocument } from '@/hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';

function MyComponent() {
  const { data: posts, loading } = useCollection('posts', [
    where('status', '==', 'published'),
    orderBy('created_at', 'desc'),
  ]);

  const addPost = async () => {
    const id = await createDocument('posts', {
      title: 'Novo Post',
      content: 'Conteúdo...',
      user_id: 'user123',
    });
    console.log('Post criado:', id);
  };

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### Storage

```tsx
import { useStorage, getUserUploadPath } from '@/hooks/useStorage';

function UploadComponent() {
  const { uploadFileWithProgress, progress, uploading } = useStorage();
  const { user } = useAuth();

  const handleUpload = async (file: File) => {
    const path = getUserUploadPath(user.uid, 'images');
    const result = await uploadFileWithProgress(file, path);
    console.log('URL:', result.url);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <p>Progresso: {progress?.progress.toFixed(0)}%</p>}
    </div>
  );
}
```

## 🔒 Regras de Segurança

Lembre-se de configurar as regras de segurança no Firebase Console!

### Firestore Rules (exemplo básico)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles: usuário só lê/escreve o próprio
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Coleções do usuário
    match /generated_scripts/{docId} {
      allow read, write: if request.auth != null 
        && resource.data.user_id == request.auth.uid;
    }
  }
}
```

### Storage Rules (exemplo básico)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📚 Documentação

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firebase Storage](https://firebase.google.com/docs/storage)

## ⚠️ Notas Importantes

1. **Nunca commite o `.env`** - Adicione ao `.gitignore`
2. **Configure índices** - O Firestore requer índices para queries complexas
3. **Monitore custos** - Firebase cobra por leituras/escritas
4. **Use emuladores** - Para desenvolvimento local sem custos
