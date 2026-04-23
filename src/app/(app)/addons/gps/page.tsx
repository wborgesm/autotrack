"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin, Wifi, WifiOff, Settings, Link2, RefreshCw, Car, Plus, Pencil, Trash2, Server,
  Eye, EyeOff, CheckCircle, XCircle, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />,
});

interface AutotrackDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
}

interface AutotrackPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  serverTime: string;
}

interface Servidor {
  id: string;
  nome: string;
  url: string;
  port: number;
  username: string;
  password: string;
  ativo: boolean;
  ordem: number;
}

const OFFLINE_THRESHOLD_MINUTES = 10; // ajuste conforme necessário

export default function GpsPage() {
  const { data: session } = useSession();
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [selectedServer, setSelectedServer] = useState<Servidor | null>(null);
  const [devices, setDevices] = useState<AutotrackDevice[]>([]);
  const [positions, setPositions] = useState<AutotrackPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Servidor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [serverForm, setServerForm] = useState({
    nome: "",
    url: "",
    port: "443",
    username: "",
    password: "",
    ativo: true,
    ordem: 1,
  });

  const isDeviceOnline = (device: AutotrackDevice) => {
    if (!device.lastUpdate) return false;
    const last = new Date(device.lastUpdate);
    const now = new Date();
    const diffMinutes = (now.getTime() - last.getTime()) / (1000 * 60);
    return diffMinutes < OFFLINE_THRESHOLD_MINUTES;
  };

  const fetchServidores = useCallback(async () => {
    const res = await fetch("/api/addons/gps/servers");
    if (res.ok) {
      const data = await res.json();
      setServidores(data);
      if (data.length > 0 && !selectedServer) {
        setSelectedServer(data[0]);
      }
    }
  }, [selectedServer]);

  const fetchDevices = useCallback(async () => {
    if (!selectedServer) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/addons/gps?action=devices&serverId=${selectedServer.id}`);
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
        setConnectionOk(true);
        const posRes = await fetch(`/api/addons/gps?action=positions&serverId=${selectedServer.id}`);
        if (posRes.ok) setPositions(await posRes.json());
      } else {
        setConnectionOk(false);
        setDevices([]);
        setPositions([]);
      }
    } catch {
      setConnectionOk(false);
    } finally {
      setLoading(false);
    }
  }, [selectedServer]);

  const fetchVeiculos = useCallback(async () => {
    const res = await fetch("/api/veiculos");
    if (res.ok) setVeiculos(await res.json());
  }, []);

  useEffect(() => {
    if (session?.user.addons?.gps) {
      fetchServidores();
      fetchVeiculos();
    }
  }, [session, fetchServidores, fetchVeiculos]);

  useEffect(() => {
    if (selectedServer) fetchDevices();
  }, [selectedServer, fetchDevices]);

  const handleTestConnection = async (server?: Servidor) => {
    const target = server || selectedServer;
    if (!target) return;
    setTesting(true);
    try {
      const res = await fetch(`/api/addons/gps?action=test&serverId=${target.id}`);
      const data = await res.json();
      alert(data.ok ? "Conexão bem-sucedida!" : "Falha na conexão. Verifique os dados.");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveServer = async () => {
    const method = editingServer ? "PUT" : "POST";
    const url = editingServer
      ? `/api/addons/gps/servers/${editingServer.id}`
      : "/api/addons/gps/servers";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...serverForm,
        port: parseInt(serverForm.port),
      }),
    });
    if (res.ok) {
      setServerDialogOpen(false);
      setEditingServer(null);
      setServerForm({ nome: "", url: "", port: "443", username: "", password: "", ativo: true, ordem: 1 });
      fetchServidores();
    } else {
      alert("Erro ao salvar servidor.");
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Remover este servidor?")) return;
    await fetch(`/api/addons/gps/servers/${id}`, { method: "DELETE" });
    fetchServidores();
    if (selectedServer?.id === id) setSelectedServer(null);
  };

  const handleVincular = async () => {
    if (!selectedVeiculo || !selectedDeviceId || !selectedServer) return;
    const device = devices.find(d => d.id.toString() === selectedDeviceId);
    if (!device) return;
    const res = await fetch("/api/addons/gps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "vincular",
        veiculoId: selectedVeiculo,
        traccarDeviceId: device.id,
        imei: device.uniqueId,
      }),
    });
    if (res.ok) {
      setVincularOpen(false);
      fetchVeiculos();
    }
  };

  const getPositionForDevice = (deviceId: number) => {
    return positions.find((p) => p.deviceId === deviceId);
  };

  const mapMarkers = positions.map((pos) => ({
    id: pos.deviceId,
    lat: pos.latitude,
    lng: pos.longitude,
    title: devices.find((d) => d.id === pos.deviceId)?.name || `Device ${pos.deviceId}`,
    speed: pos.speed,
  }));

  if (!session?.user.addons?.gps) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Addon GPS não ativo</h2>
        <p className="text-gray-500">Contate o administrador para ativar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rastreamento GPS</h1>
          <p className="text-gray-500">Gerencie seus servidores e visualize a frota</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchServidores(); fetchDevices(); }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={serverDialogOpen} onOpenChange={setServerDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Servidor
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
              <DialogHeader>
                <DialogTitle>{editingServer ? "Editar Servidor" : "Novo Servidor Autotrack"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div><Label>Nome</Label><Input value={serverForm.nome} onChange={e => setServerForm({...serverForm, nome: e.target.value})} /></div>
                <div><Label>URL (IP ou domínio)</Label><Input value={serverForm.url} onChange={e => setServerForm({...serverForm, url: e.target.value})} /></div>
                <div><Label>Porta</Label><Input type="number" value={serverForm.port} onChange={e => setServerForm({...serverForm, port: e.target.value})} /></div>
                <div><Label>Utilizador</Label><Input value={serverForm.username} onChange={e => setServerForm({...serverForm, username: e.target.value})} /></div>
                <div className="relative">
                  <Label>Senha</Label>
                  <Input type={showPassword ? "text" : "password"} value={serverForm.password} onChange={e => setServerForm({...serverForm, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-8 text-gray-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={serverForm.ativo} onCheckedChange={v => setServerForm({...serverForm, ativo: v})} /><Label>Ativo</Label></div>
                  <div><Label>Ordem</Label><Input type="number" value={serverForm.ordem} onChange={e => setServerForm({...serverForm, ordem: parseInt(e.target.value)})} className="w-20" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveServer}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="servidores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="servidores">Servidores</TabsTrigger>
          <TabsTrigger value="mapa" disabled={!selectedServer}>Mapa</TabsTrigger>
          <TabsTrigger value="vinculos" disabled={!selectedServer}>Vínculos</TabsTrigger>
        </TabsList>

        <TabsContent value="servidores">
          <Card>
            <CardHeader><CardTitle>Seus Servidores Autotrack</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nome</TableHead><TableHead>URL:Porta</TableHead><TableHead>Status</TableHead><TableHead>Ordem</TableHead><TableHead>Ações</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {servidores.map(srv => (
                    <TableRow key={srv.id} className={selectedServer?.id === srv.id ? "bg-blue-50" : ""}>
                      <TableCell>{srv.nome}</TableCell>
                      <TableCell>{srv.url}:{srv.port}</TableCell>
                      <TableCell>
                        <Badge variant={srv.ativo ? "default" : "secondary"}>{srv.ativo ? "Ativo" : "Inativo"}</Badge>
                      </TableCell>
                      <TableCell>{srv.ordem}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedServer(srv)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Usar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingServer(srv); setServerForm({...srv, port: srv.port.toString()}); setServerDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleTestConnection(srv)} disabled={testing}>
                          <Wifi className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteServer(srv.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedServer && <p className="mt-2 text-sm text-gray-500">Servidor atual: <strong>{selectedServer.nome}</strong></p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapa">
          <Card>
            <CardHeader><CardTitle>Mapa em Tempo Real</CardTitle></CardHeader>
            <CardContent>
              {connectionOk === false && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded flex items-center gap-2">
                  <WifiOff className="h-5 w-5" /> Não foi possível conectar ao servidor selecionado.
                </div>
              )}
              <div className="h-[400px] rounded-lg overflow-hidden border">
                <MapComponent markers={mapMarkers} />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Dispositivos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {devices.map(device => {
                  const pos = getPositionForDevice(device.id);
                  const online = isDeviceOnline(device);
                  return (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${online ? "bg-green-100" : "bg-gray-100"}`}>
                          <Car className={`h-4 w-4 ${online ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-gray-500">IMEI: {device.uniqueId}</p>
                          {device.lastUpdate && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(device.lastUpdate).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={online ? "default" : "secondary"}>
                          {online ? (pos ? `${pos.speed} km/h` : "Online") : "Offline"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vinculos">
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between">
              Veículos Vinculados
              <Dialog open={vincularOpen} onOpenChange={setVincularOpen}>
                <DialogTrigger asChild><Button size="sm"><Link2 className="mr-2 h-4 w-4" /> Vincular</Button></DialogTrigger>
                <DialogContent aria-describedby={undefined} aria-describedby="dialog-desc"><p id="dialog-desc" class="hidden">Formulário</p>
                  <DialogHeader><DialogTitle>Vincular Veículo a Dispositivo</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select onValueChange={setSelectedVeiculo} value={selectedVeiculo}>
                      <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                      <SelectContent>{veiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedDeviceId} value={selectedDeviceId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o dispositivo" /></SelectTrigger>
                      <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name} ({d.uniqueId})</SelectItem>)}</SelectContent>
                    </Select>
                    <Button onClick={handleVincular}>Confirmar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {veiculos.filter(v => v.imeiGps).map(v => {
                  const device = devices.find(d => d.uniqueId === v.imeiGps);
                  const online = device ? isDeviceOnline(device) : false;
                  return (
                    <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div><p className="font-medium">{v.placa} - {v.modelo}</p><p className="text-sm text-gray-500">IMEI: {v.imeiGps}</p></div>
                      <Badge variant={online ? "default" : "secondary"}>{online ? "Online" : "Offline"}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
