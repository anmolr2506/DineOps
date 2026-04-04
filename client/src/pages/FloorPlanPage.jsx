import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import FloorCard from '../components/floorplan/FloorCard';
import TableCard from '../components/floorplan/TableCard';
import AddFloorModal from '../components/floorplan/AddFloorModal';
import AddTableModal from '../components/floorplan/AddTableModal';

const API_BASE = 'http://localhost:5000/api';

const buildDefaultSlot = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    now.setSeconds(0, 0);

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`
    };
};

const FloorPlanPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const canManageFloors = user?.role === 'admin';
    const canManageTables = user?.role === 'admin';
    const canToggleStatus = user?.role === 'admin' || user?.role === 'staff';

    const [floors, setFloors] = useState([]);
    const [selectedFloorId, setSelectedFloorId] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [floorModalOpen, setFloorModalOpen] = useState(false);
    const [tableModalOpen, setTableModalOpen] = useState(false);
    const [savingFloor, setSavingFloor] = useState(false);
    const [savingTable, setSavingTable] = useState(false);

    const defaultSlot = useMemo(() => buildDefaultSlot(), []);
    const [slotDate, setSlotDate] = useState(defaultSlot.date);
    const [slotTime, setSlotTime] = useState(defaultSlot.time);
    const durationMinutes = 120;

    const selectedFloor = useMemo(
        () => floors.find((floor) => floor.id === selectedFloorId) || null,
        [floors, selectedFloorId]
    );

    const loadFloors = async () => {
        const response = await axios.get(`${API_BASE}/floors`);
        const nextFloors = response.data.floors || [];
        setFloors(nextFloors);

        if (nextFloors.length === 0) {
            setSelectedFloorId(null);
            setTables([]);
            return;
        }

        const stillExists = nextFloors.some((floor) => floor.id === selectedFloorId);
        const fallbackFloorId = stillExists ? selectedFloorId : nextFloors[0].id;
        setSelectedFloorId(fallbackFloorId);
    };

    const loadTables = async (floorId) => {
        if (!floorId) {
            setTables([]);
            return;
        }

        const response = await axios.get(`${API_BASE}/tables`, {
            params: {
                floor_id: floorId,
                date: slotDate,
                time: slotTime,
                duration_minutes: durationMinutes
            }
        });

        setTables(response.data.tables || []);
    };

    const refreshAll = async () => {
        try {
            setLoading(true);
            setError('');
            await loadFloors();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load floor plan.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshAll();
    }, []);

    useEffect(() => {
        if (!selectedFloorId) return;
        loadTables(selectedFloorId).catch((err) => {
            setError(err.response?.data?.error || 'Failed to load tables.');
        });
    }, [selectedFloorId, slotDate, slotTime]);

    useEffect(() => {
        const socket = io('http://localhost:5000', {
            autoConnect: true,
            transports: ['websocket']
        });

        const onReservationChange = () => {
            loadFloors().catch(() => {});
            if (selectedFloorId) {
                loadTables(selectedFloorId).catch(() => {});
            }
        };

        socket.on('table_reservation_changed', onReservationChange);
        return () => {
            socket.off('table_reservation_changed', onReservationChange);
            socket.disconnect();
        };
    }, [selectedFloorId, slotDate, slotTime]);

    const handleCreateFloor = async (floorName) => {
        try {
            setSavingFloor(true);
            setError('');
            await axios.post(`${API_BASE}/floors`, {
                floor_name: floorName
            });
            await loadFloors();
            setFloorModalOpen(false);
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create floor.');
            return false;
        } finally {
            setSavingFloor(false);
        }
    };

    const handleDuplicateFloor = async (floorId) => {
        try {
            setError('');
            await axios.post(`${API_BASE}/floors/duplicate/${floorId}`);
            await loadFloors();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to duplicate floor.');
        }
    };

    const handleUpdateFloor = async (floorId, floorName) => {
        try {
            setError('');
            await axios.put(`${API_BASE}/floors/${floorId}`, {
                floor_name: floorName
            });
            await loadFloors();
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update floor.');
            return false;
        }
    };

    const handleDeleteFloor = async (floorId) => {
        try {
            setError('');
            await axios.delete(`${API_BASE}/floors/${floorId}`);
            await loadFloors();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete floor.');
        }
    };

    const handleCreateTable = async (payload) => {
        try {
            setSavingTable(true);
            setError('');
            await axios.post(`${API_BASE}/tables`, {
                ...payload,
                floor_id: selectedFloorId
            });
            await loadFloors();
            await loadTables(selectedFloorId);
            setTableModalOpen(false);
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create table.');
            return false;
        } finally {
            setSavingTable(false);
        }
    };

    const handleDuplicateTable = async (tableId) => {
        try {
            setError('');
            await axios.post(`${API_BASE}/tables/duplicate/${tableId}`);
            await loadFloors();
            await loadTables(selectedFloorId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to duplicate table.');
        }
    };

    const handleUpdateTable = async (tableId, payload) => {
        try {
            setError('');
            await axios.put(`${API_BASE}/tables/${tableId}`, payload);
            await loadTables(selectedFloorId);
            await loadFloors();
            return true;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update table.');
            return false;
        }
    };

    const handleDeleteTable = async (tableId) => {
        try {
            setError('');
            await axios.delete(`${API_BASE}/tables/${tableId}`);
            await loadFloors();
            await loadTables(selectedFloorId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete table.');
        }
    };

    const handleToggleStatus = async (tableId, nextStatus) => {
        try {
            setError('');
            await axios.put(`${API_BASE}/tables/${tableId}/status`, {
                status: nextStatus
            });
            await loadTables(selectedFloorId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update table status.');
        }
    };

    const handleClearTableBookings = async (tableId) => {
        try {
            setError('');
            await axios.delete(`${API_BASE}/tables/${tableId}/bookings`);
            await loadTables(selectedFloorId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to clear table bookings.');
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] px-4 py-8 text-[#f8efe0] sm:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="rounded-2xl border border-[#c9a14a]/20 bg-[#0a1628]/85 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-[#c9a14a]/80">Session Floor Plan</p>
                            <h1 className="mt-1 text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                                Manage Restaurant Floor Plan
                            </h1>
                            <p className="mt-2 text-sm text-[#f8efe0]/70">Shared floor plan with live reservation occupancy for selected slot.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/sessions')}
                                className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-2 text-sm font-semibold text-[#f5dfb3]"
                            >
                                Back to Sessions
                            </button>
                            {canManageFloors && (
                                <button
                                    type="button"
                                    onClick={() => setFloorModalOpen(true)}
                                    className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#1f1201]"
                                >
                                    + Add Floor
                                </button>
                            )}
                            {canManageTables && selectedFloorId && (
                                <button
                                    type="button"
                                    onClick={() => setTableModalOpen(true)}
                                    className="rounded-lg bg-linear-to-r from-[#c2954f] to-[#e2bf85] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#1f1201]"
                                >
                                    + Add Table
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl border border-white/10 bg-[#0a1628]/75 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/75">Reservation Slot Preview</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <input
                            type="date"
                            value={slotDate}
                            onChange={(event) => setSlotDate(event.target.value)}
                            className="rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black"
                        />
                        <input
                            type="time"
                            value={slotTime}
                            onChange={(event) => setSlotTime(event.target.value)}
                            className="rounded-lg border border-white/15 bg-white px-4 py-3 text-sm text-black"
                        />
                        <div className="rounded-lg border border-[#c9a14a]/35 bg-[#0d1d35] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#f5dfb3]">
                            Duration: {durationMinutes} mins
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="rounded-lg border border-red-400/50 bg-red-900/30 p-3 text-sm text-red-100">
                        {error}
                    </div>
                )}

                <section className="rounded-2xl border border-white/10 bg-[#0a1628]/75 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/75">Floors</p>
                    {loading ? (
                        <p className="mt-3 text-sm text-[#f8efe0]/70">Loading floor plan...</p>
                    ) : floors.length === 0 ? (
                        <p className="mt-3 text-sm text-[#f8efe0]/70">No floors available.</p>
                    ) : (
                        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {floors.map((floor) => (
                                <FloorCard
                                    key={floor.id}
                                    floor={floor}
                                    isSelected={floor.id === selectedFloorId}
                                    onSelect={() => setSelectedFloorId(floor.id)}
                                    canManage={canManageFloors}
                                    onUpdate={handleUpdateFloor}
                                    onDuplicate={() => handleDuplicateFloor(floor.id)}
                                    onDelete={() => handleDeleteFloor(floor.id)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0a1628]/75 p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c9a14a]/75">Tables</p>
                        {selectedFloor && (
                            <p className="text-sm text-[#f8efe0]/75">{selectedFloor.name}</p>
                        )}
                    </div>

                    {!selectedFloorId ? (
                        <p className="mt-3 text-sm text-[#f8efe0]/70">Select a floor to view tables.</p>
                    ) : tables.length === 0 ? (
                        <p className="mt-3 text-sm text-[#f8efe0]/70">No tables on this floor.</p>
                    ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {tables.map((table) => (
                                <TableCard
                                    key={table.id}
                                    table={table}
                                    canManage={canManageTables}
                                    canToggleStatus={canToggleStatus}
                                    occupiedStyle="fill"
                                    showBookings={true}
                                    onUpdate={handleUpdateTable}
                                    onDuplicate={handleDuplicateTable}
                                    onDelete={handleDeleteTable}
                                    onToggleStatus={handleToggleStatus}
                                    onClearBookings={handleClearTableBookings}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <AddFloorModal
                isOpen={floorModalOpen}
                onClose={() => setFloorModalOpen(false)}
                onSubmit={handleCreateFloor}
                loading={savingFloor}
            />

            <AddTableModal
                isOpen={tableModalOpen}
                onClose={() => setTableModalOpen(false)}
                onSubmit={handleCreateTable}
                loading={savingTable}
            />
        </div>
    );
};

export default FloorPlanPage;
