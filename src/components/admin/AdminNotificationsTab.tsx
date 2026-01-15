import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, MessageSquare, Users, Play, Pause, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FakeUser {
  id: string;
  name: string;
  type: "purchase" | "new_user";
}

export const AdminNotificationsTab = () => {
  const [purchaseEnabled, setPurchaseEnabled] = useState(true);
  const [newUserEnabled, setNewUserEnabled] = useState(true);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [newUserMessage, setNewUserMessage] = useState("");
  const [purchaseSid, setPurchaseSid] = useState("");
  const [newUserSid, setNewUserSid] = useState("");
  const [purchaseLoop, setPurchaseLoop] = useState(false);
  const [newUserLoop, setNewUserLoop] = useState(false);
  const [fakeUsers, setFakeUsers] = useState<FakeUser[]>([]);
  const [addFakeUserOpen, setAddFakeUserOpen] = useState(false);
  const [newFakeUserName, setNewFakeUserName] = useState("");
  const [newFakeUserType, setNewFakeUserType] = useState<"purchase" | "new_user">("purchase");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    if (data?.value) {
      const n = data.value as Record<string, any>;
      setPurchaseEnabled(n.purchase_enabled ?? true);
      setNewUserEnabled(n.new_user_enabled ?? true);
      setPurchaseMessage(n.purchase_message || "");
      setNewUserMessage(n.new_user_message || "");
      setPurchaseSid(n.purchase_sid || "");
      setNewUserSid(n.new_user_sid || "");
      setFakeUsers(n.fake_users || []);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    const { data: current } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .maybeSingle();

    const fakeUsersJson = fakeUsers.map(u => ({ id: u.id, name: u.name, type: u.type }));
    
    const newValue = {
      ...((current?.value as Record<string, unknown>) || {}),
      purchase_enabled: purchaseEnabled,
      new_user_enabled: newUserEnabled,
      purchase_message: purchaseMessage,
      new_user_message: newUserMessage,
      purchase_sid: purchaseSid,
      new_user_sid: newUserSid,
      fake_users: fakeUsersJson,
    };

    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        key: "notifications",
        value: newValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    setSaving(false);
    if (error) {
      console.error("Erro ao salvar notificações:", error);
      toast.error("Erro ao salvar");
    } else {
      toast.success("Configurações salvas!");
    }
  };

  const handleAddFakeUser = () => {
    if (!newFakeUserName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const newUser: FakeUser = {
      id: crypto.randomUUID(),
      name: newFakeUserName,
      type: newFakeUserType,
    };

    setFakeUsers([...fakeUsers, newUser]);
    setNewFakeUserName("");
    setAddFakeUserOpen(false);
    toast.success("Usuário fictício adicionado!");
  };

  const handleRemoveFakeUser = (id: string) => {
    setFakeUsers(fakeUsers.filter((u) => u.id !== id));
    toast.success("Usuário removido!");
  };

  const handleCreateBatch = () => {
    const batchUsers: FakeUser[] = [];
    for (let i = 0; i < 60; i++) {
      batchUsers.push({
        id: crypto.randomUUID(),
        name: `Usuário Compra ${i + 1}`,
        type: "purchase",
      });
    }
    for (let i = 0; i < 40; i++) {
      batchUsers.push({
        id: crypto.randomUUID(),
        name: `Novo Usuário ${i + 1}`,
        type: "new_user",
      });
    }
    setFakeUsers([...fakeUsers, ...batchUsers]);
    toast.success("100 usuários fictícios criados!");
  };

  const togglePurchaseLoop = () => {
    setPurchaseLoop(!purchaseLoop);
    toast.info(purchaseLoop ? "Loop de compras pausado" : "Loop de compras iniciado");
  };

  const toggleNewUserLoop = () => {
    setNewUserLoop(!newUserLoop);
    toast.info(newUserLoop ? "Loop de novos usuários pausado" : "Loop de novos usuários iniciado");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configuração de Notificações</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Notificações de Compra</h4>
              <Switch checked={purchaseEnabled} onCheckedChange={setPurchaseEnabled} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">SID</label>
                <Input
                  className="bg-secondary border-border"
                  placeholder="SID"
                  value={purchaseSid}
                  onChange={(e) => setPurchaseSid(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Mensagem</label>
                <Input
                  className="bg-secondary border-border"
                  placeholder="[push] ou cultura de compras no plano [plano]"
                  value={purchaseMessage}
                  onChange={(e) => setPurchaseMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Notificações de Novos Usuários</h4>
              <Switch checked={newUserEnabled} onCheckedChange={setNewUserEnabled} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">SID</label>
                <Input
                  className="bg-secondary border-border"
                  placeholder="SID"
                  value={newUserSid}
                  onChange={(e) => setNewUserSid(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Mensagem</label>
                <Input
                  className="bg-secondary border-border"
                  placeholder="[push] ou cultura de eventos na plataforma"
                  value={newUserMessage}
                  onChange={(e) => setNewUserMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={saveSettings}
          className="w-full mt-4 bg-success text-success-foreground"
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Salvar Configurações
        </Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">Usuários Fictícios</h3>
          </div>
          <span className="text-sm text-muted-foreground">{fakeUsers.length} usuários</span>
        </div>
        <div className="flex gap-4 mb-4">
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setAddFakeUserOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Usuário Fictício
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500"
            onClick={handleCreateBatch}
          >
            Criar 100 Usuários (60 Compra + 40 Novo)
          </Button>
        </div>

        {fakeUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum usuário fictício cadastrado.
          </p>
        ) : (
          <div className="max-h-48 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOME</TableHead>
                  <TableHead>TIPO</TableHead>
                  <TableHead>AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fakeUsers.slice(0, 10).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.type === "purchase" ? "Compra" : "Novo Usuário"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleRemoveFakeUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {fakeUsers.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      ... e mais {fakeUsers.length - 10} usuários
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Controles de Loop</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-4">Notificações de Compra</h4>
            <div className="flex gap-2">
              <Button
                onClick={togglePurchaseLoop}
                className={purchaseLoop ? "bg-destructive" : "bg-success"}
              >
                {purchaseLoop ? (
                  <Pause className="w-4 h-4 mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {purchaseLoop ? "Parar Loop" : "Iniciar Loop"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {purchaseLoop ? "Em execução..." : "Aguardando..."}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-4">Notificações de Novos Usuários</h4>
            <div className="flex gap-2">
              <Button
                onClick={toggleNewUserLoop}
                className={newUserLoop ? "bg-destructive" : "bg-success"}
              >
                {newUserLoop ? (
                  <Pause className="w-4 h-4 mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {newUserLoop ? "Parar Loop" : "Iniciar Loop"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {newUserLoop ? "Em execução..." : "Aguardando..."}
            </p>
          </div>
        </div>
      </Card>

      {/* Add Fake User Dialog */}
      <Dialog open={addFakeUserOpen} onOpenChange={setAddFakeUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Usuário Fictício</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome</label>
              <Input
                value={newFakeUserName}
                onChange={(e) => setNewFakeUserName(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Tipo</label>
              <div className="flex gap-4">
                <Button
                  variant={newFakeUserType === "purchase" ? "default" : "outline"}
                  onClick={() => setNewFakeUserType("purchase")}
                >
                  Compra
                </Button>
                <Button
                  variant={newFakeUserType === "new_user" ? "default" : "outline"}
                  onClick={() => setNewFakeUserType("new_user")}
                >
                  Novo Usuário
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFakeUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddFakeUser}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
