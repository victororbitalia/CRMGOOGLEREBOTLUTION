import React, { useState, useMemo, useEffect } from 'react';
import { Reservation, Table, Settings, ReservationStatus, TableStatus, Zone } from './types';
import { HomeIcon, CalendarIcon, TableIcon, CogIcon, PlusIcon, UsersIcon, TrashIcon, LogoutIcon, EditIcon } from './components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReservations, useTables, useSettings } from './hooks';


type Page = 'dashboard' | 'reservations' | 'tables' | 'settings';
type ModalState = 'none' | 'create' | 'edit';
type Language = 'en' | 'es';

const NODE_ENV: string = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Translation
const translations = {
  en: {
    dashboard: 'Dashboard', reservations: 'Reservations', tables: 'Tables', settings: 'Settings', logout: 'Logout',
    todaysReservations: "Today's Reservations", totalDinersToday: "Total Diners Today", currentOccupancy: "Current Occupancy",
    upcomingReservations: "Upcoming Reservations", occupancyByHour: "Occupancy by Hour", occupiedTables: "Occupied Tables",
    newReservation: "New Reservation", upcoming: "Upcoming", past: "Past", all: "All", notNotified: "Not Notified", notified: "Notified",
    customer: "Customer", dateTime: "Date & Time", party: "Party", status: "Status", table: "Table", notification: "Notification", actions: "Actions", edit: "Edit", delete: "Delete",
    editReservation: "Edit Reservation", customerName: "Customer Name", phone: "Phone", partySize: "Party Size", assignTable: "Assign Table", notes: "Notes", notificationSent: "Notification Sent",
    cancel: "Cancel", saveChanges: "Save Changes", none: "None", markAsNotified: "Mark as Notified",
    tableManagement: "Table Management", newTable: "New Table",
    editTable: "Edit Table", tableNameNumber: "Table Name / Number", capacity: "Capacity", zone: "Zone", save: "Save",
    restaurantSettings: "Restaurant Settings", generalInformation: "General Information", restaurantName: "Restaurant Name", email: "Email", address: "Address",
    bookingRules: "Booking Rules", maxDaysInAdvance: "Max days in advance", defaultDurationMin: "Default Duration (min)", maxPartySize: "Max party size", walkInTables: "Walk-in Tables",
    zoneManagement: "Zone Management", openingHours: "Opening Hours", open: "Open", lunch: "Lunch", dinner: "Dinner",
    username: "Username", password: "Password", login: "Login", invalidPassword: "Invalid password.",
    deleteConfirmationTitle: "Delete {type}", deleteConfirmationMessage: "Are you sure you want to delete this {type}? This action cannot be undone.",
    confirm: "Confirm", settingsSaved: "Settings saved!", cannotDeleteTable: "Cannot delete a table that is currently occupied or reserved.",
    loadingCRM: "Loading CRM...", couldNotLoadData: "Could not load restaurant data.",
    languageSettings: "Language Settings", language: "Language",
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
  },
  es: {
    dashboard: 'Panel', reservations: 'Reservas', tables: 'Mesas', settings: 'Ajustes', logout: 'Cerrar Sesión',
    todaysReservations: "Reservas de Hoy", totalDinersToday: "Total de Comensales Hoy", currentOccupancy: "Ocupación Actual",
    upcomingReservations: "Próximas Reservas", occupancyByHour: "Ocupación por Hora", occupiedTables: "Mesas Ocupadas",
    newReservation: "Nueva Reserva", upcoming: "Próximas", past: "Pasadas", all: "Todas", notNotified: "No Notificadas", notified: "Notificadas",
    customer: "Cliente", dateTime: "Fecha y Hora", party: "Personas", status: "Estado", table: "Mesa", notification: "Notificación", actions: "Acciones", edit: "Editar", delete: "Eliminar",
    editReservation: "Editar Reserva", customerName: "Nombre del Cliente", phone: "Teléfono", partySize: "Nº Personas", assignTable: "Asignar Mesa", notes: "Notas", notificationSent: "Notificación Enviada",
    cancel: "Cancelar", saveChanges: "Guardar Cambios", none: "Ninguna", markAsNotified: "Marcar como Notificada",
    tableManagement: "Gestión de Mesas", newTable: "Nueva Mesa",
    editTable: "Editar Mesa", tableNameNumber: "Nombre / Número de Mesa", capacity: "Capacidad", zone: "Zona", save: "Guardar",
    restaurantSettings: "Ajustes del Restaurante", generalInformation: "Información General", restaurantName: "Nombre del Restaurante", email: "Email", address: "Dirección",
    bookingRules: "Reglas de Reserva", maxDaysInAdvance: "Max días de antelación", defaultDurationMin: "Duración por defecto (min)", maxPartySize: "Max personas por reserva", walkInTables: "Mesas sin reserva",
    zoneManagement: "Gestión de Zonas", openingHours: "Horario de Apertura", open: "Abierto", lunch: "Almuerzo", dinner: "Cena",
    username: "Usuario", password: "Contraseña", login: "Iniciar Sesión", invalidPassword: "Contraseña inválida.",
    deleteConfirmationTitle: "Eliminar {type}", deleteConfirmationMessage: "¿Estás seguro de que quieres eliminar este {type}? Esta acción no se puede deshacer.",
    confirm: "Confirmar", settingsSaved: "¡Ajustes guardados!", cannotDeleteTable: "No se puede eliminar una mesa que está actualmente ocupada o reservada.",
    loadingCRM: "Cargando CRM...", couldNotLoadData: "No se pudieron cargar los datos del restaurante.",
    languageSettings: "Configuración de Idioma", language: "Idioma",
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
  }
};

// Helper Functions
const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
        case ReservationStatus.Confirmed: return 'bg-green-100 text-green-800';
        case ReservationStatus.Pending: return 'bg-yellow-100 text-yellow-800';
        case ReservationStatus.Seated: return 'bg-blue-100 text-blue-800';
        case ReservationStatus.Completed: return 'bg-gray-100 text-gray-800';
        case ReservationStatus.Cancelled: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getTableStatusColor = (status: TableStatus) => {
    switch(status) {
        case TableStatus.Available: return 'bg-green-500 border-green-700';
        case TableStatus.Occupied: return 'bg-red-500 border-red-700';
        case TableStatus.Reserved: return 'bg-yellow-500 border-yellow-700';
        default: return 'bg-gray-400 border-gray-600';
    }
};

const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};

const getNotificationColor = (notificationSent?: boolean) => {
    if (notificationSent === true) {
        return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
};

const getNotificationIcon = (notificationSent?: boolean) => {
    if (notificationSent === true) {
        return '✓';
    }
    return '✗';
};

// Components
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-primary-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const DashboardView: React.FC<{ reservations: Reservation[]; tables: Table[], t: (key: keyof typeof translations['en']) => string }> = ({ reservations, tables, t }) => {
    const today = new Date().toDateString();
    const todaysReservations = reservations.filter(r => new Date(r.dateTime).toDateString() === today);
    const totalDinersToday = todaysReservations.reduce((sum, r) => sum + r.partySize, 0);
    const occupancyRate = tables.length > 0 ? ((tables.filter(t => t.status !== TableStatus.Available).length / tables.length) * 100).toFixed(0) : 0;
    const occupancyData = [ { time: '6 PM', occupied: 3 }, { time: '7 PM', occupied: 5 }, { time: '8 PM', occupied: 8 }, { time: '9 PM', occupied: 7 }, { time: '10 PM', occupied: 4 }, ];
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('dashboard')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatCard title={t('todaysReservations')} value={todaysReservations.length} icon={<CalendarIcon className="h-6 w-6 text-primary-600" />} />
                <StatCard title={t('totalDinersToday')} value={totalDinersToday} icon={<UsersIcon className="h-6 w-6 text-primary-600" />} />
                <StatCard title={t('currentOccupancy')} value={`${occupancyRate}%`} icon={<TableIcon className="h-6 w-6 text-primary-600" />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('upcomingReservations')}</h2>
                    <div className="space-y-4">
                        {todaysReservations.filter(r => r.status !== ReservationStatus.Completed && r.status !== ReservationStatus.Cancelled).slice(0, 5).map(res => (
                            <div key={res.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                <div>
                                    <p className="font-bold text-gray-800">{res.customerName} ({res.partySize}p)</p>
                                    <p className="text-sm text-gray-600">{new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNotificationColor(res.notificationSent)}`}>
                                        {getNotificationIcon(res.notificationSent)}
                                    </span>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(res.status)}`}>{res.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('occupancyByHour')}</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={occupancyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Legend /><Bar dataKey="occupied" fill="#3b82f6" name={t('occupiedTables')} /></BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const ReservationModal: React.FC<{ mode: 'create' | 'edit'; isOpen: boolean; onClose: () => void; reservation: Reservation | null; onSave: (reservation: Reservation) => void; tables: Table[]; t: (key: keyof typeof translations['en']) => string; }> = ({ mode, isOpen, onClose, reservation, onSave, tables, t }) => {
    const [formData, setFormData] = useState<Reservation | null>(null);

    useEffect(() => {
        if (mode === 'edit' && reservation) {
            setFormData(reservation);
        } else {
            setFormData({
                id: '', customerName: '', phone: '', partySize: 2, dateTime: new Date().toISOString(), status: ReservationStatus.Pending, notes: '', tableId: undefined
            });
        }
    }, [reservation, mode, isOpen]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: name === 'partySize' || name === 'tableId' ? parseInt(value, 10) : value } : null);
    };

    const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => prev ? { ...prev, dateTime: new Date(e.target.value).toISOString() } : null);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
        }
    };

    const availableTables = tables.filter(t => t.status === TableStatus.Available || t.id === reservation?.tableId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{mode === 'edit' ? t('editReservation') : t('newReservation')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customerName')}</label>
                        <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('partySize')}</label>
                            <input type="number" name="partySize" value={formData.partySize} onChange={handleChange} min="1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900">
                                {Object.values(ReservationStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('dateTime')}</label>
                        <input type="datetime-local" name="dateTime" value={formatDateTimeLocal(formData.dateTime)} onChange={handleDateTimeChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('assignTable')}</label>
                        <select name="tableId" value={formData.tableId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900">
                            <option value="">{t('none')}</option>
                            {availableTables.map(t => <option key={t.id} value={t.id}>{t.name} (Cap: {t.capacity})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
                        <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900"></textarea>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="notification_sent" checked={formData.notification_sent || false} onChange={(e) => setFormData(prev => prev ? { ...prev, notification_sent: e.target.checked } : null)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300" />
                        <label className="ml-2 block text-sm text-gray-700">{t('notificationSent')}</label>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{t('saveChanges')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReservationsView: React.FC<{
    reservations: Reservation[];
    filteredReservations: Reservation[];
    onAdd: (reservation: Reservation) => void;
    onUpdate: (reservation: Reservation) => void;
    onDelete: (id: string) => void;
    onMarkAsNotified: (id: string) => void;
    tables: Table[];
    setFilter: (filter: 'upcoming' | 'past' | 'all') => void;
    currentFilter: 'upcoming' | 'past' | 'all';
    t: (key: keyof typeof translations['en']) => string;
}> = ({ reservations, filteredReservations, onAdd, onUpdate, onDelete, onMarkAsNotified, tables, setFilter, currentFilter, t }) => {
    const [modalState, setModalState] = useState<ModalState>('none');
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [notificationFilter, setNotificationFilter] = useState<'all' | 'notified' | 'notNotified'>('all');
    
    const handleNewClick = () => setModalState('create');
    const handleEditClick = (reservation: Reservation) => { setSelectedReservation(reservation); setModalState('edit'); };
    const handleCloseModal = () => { setModalState('none'); setSelectedReservation(null); };

    const handleSave = (data: Reservation) => {
        if (modalState === 'create') {
            onAdd(data);
        } else if (modalState === 'edit') {
            onUpdate(data);
        }
        handleCloseModal();
    };

    // Apply notification filter to the already filtered reservations
    const filteredByNotification = useMemo(() => {
        if (notificationFilter === 'all') return filteredReservations;
        return filteredReservations.filter(res => {
            if (notificationFilter === 'notified') return res.notification_sent === true;
            if (notificationFilter === 'notNotified') return res.notification_sent !== true;
            return true;
        });
    }, [filteredReservations, notificationFilter]);

    // Count reservations pending notification
    const pendingNotificationCount = useMemo(() => {
        return reservations.filter(res => res.notification_sent !== true).length;
    }, [reservations]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{t('reservations')}</h1>
                <button onClick={handleNewClick} className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 flex items-center space-x-2"><PlusIcon className="h-5 w-5" /><span>{t('newReservation')}</span></button>
            </div>
            <div className="mb-4 flex flex-col space-y-2">
                <div className="flex space-x-2 border-b">
                    <button onClick={() => setFilter('upcoming')} className={`py-2 px-4 ${currentFilter === 'upcoming' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>{t('upcoming')}</button>
                    <button onClick={() => setFilter('past')} className={`py-2 px-4 ${currentFilter === 'past' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>{t('past')}</button>
                    <button onClick={() => setFilter('all')} className={`py-2 px-4 ${currentFilter === 'all' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>{t('all')}</button>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{t('notification')}:</span>
                    <div className="flex space-x-2">
                        <button onClick={() => setNotificationFilter('all')} className={`py-1 px-3 text-sm rounded ${notificationFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{t('all')}</button>
                        <button onClick={() => setNotificationFilter('notified')} className={`py-1 px-3 text-sm rounded ${notificationFilter === 'notified' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{t('notified')}</button>
                        <button onClick={() => setNotificationFilter('notNotified')} className={`py-1 px-3 text-sm rounded ${notificationFilter === 'notNotified' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{t('notNotified')} ({pendingNotificationCount})</button>
                    </div>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('customer')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dateTime')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('party')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('notification')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredByNotification.map(res => (
                            <tr key={res.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900">{res.customerName}</div><div className="text-sm text-gray-500">{res.phone}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(res.dateTime).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{res.partySize}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(res.status)}`}>{res.status}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getNotificationColor(res.notificationSent)}`}>
                                        {getNotificationIcon(res.notificationSent)} {res.notificationSent ? t('notified') : t('notNotified')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{res.tableId ? tables.find(t=>t.id === res.tableId)?.name : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => handleEditClick(res)} className="text-primary-600 hover:text-primary-900">{t('edit')}</button>
                                    {!res.notificationSent && (
                                        <button onClick={() => onMarkAsNotified(res.id)} className="text-blue-600 hover:text-blue-900">{t('markAsNotified')}</button>
                                    )}
                                    <button onClick={() => onDelete(res.id)} className="text-red-600 hover:text-red-900">{t('delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {modalState !== 'none' && <ReservationModal mode={modalState} isOpen={true} onClose={handleCloseModal} reservation={selectedReservation} onSave={handleSave} tables={tables} t={t} />}
        </div>
    );
};

const TableModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (table: Table) => void;
    table: Table | null;
    mode: 'create' | 'edit';
    zones: Zone[];
    t: (key: keyof typeof translations['en']) => string;
}> = ({ isOpen, onClose, onSave, table, mode, zones, t }) => {
    const [formData, setFormData] = useState<Omit<Table, 'id' | 'status'> | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && table) {
                setFormData({ name: table.name, capacity: table.capacity, zone: table.zone });
            } else {
                setFormData({ name: '', capacity: 2, zone: zones[0] || 'Indoors' });
            }
        }
    }, [isOpen, mode, table, zones]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: name === 'capacity' ? parseInt(value, 10) : value } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            const tableToSave: Table = mode === 'edit' && table
                ? { ...table, ...formData }
                : { id: 0, status: TableStatus.Available, ...formData }; // ID will be set in handler
            onSave(tableToSave);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{mode === 'edit' ? t('editTable') : t('newTable')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('tableNameNumber')}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('capacity')}</label>
                            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('zone')}</label>
                            <select name="zone" value={formData.zone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900">
                                {zones.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TablesView: React.FC<{ 
    tables: Table[]; 
    settings: Settings | null;
    onNewClick: () => void;
    onEditClick: (table: Table) => void;
    onDeleteClick: (tableId: number) => void;
    t: (key: keyof typeof translations['en']) => string;
}> = ({ tables, settings, onNewClick, onEditClick, onDeleteClick, t }) => {
    const activeZones = useMemo(() => {
        if (!settings) return [];
        return (Object.keys(settings.zones) as Zone[]).filter(zone => settings.zones[zone]);
    }, [settings]);

    const [activeZone, setActiveZone] = useState<Zone | null>(null);

    useEffect(() => {
        if (activeZones.length > 0 && (!activeZone || !activeZones.includes(activeZone))) {
            setActiveZone(activeZones[0]);
        } else if (activeZones.length === 0) {
            setActiveZone(null);
        }
    }, [activeZones, activeZone]);

    if (!settings) return null;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-3xl font-bold text-gray-800">{t('tableManagement')}</h1>
                 <button onClick={onNewClick} className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 flex items-center space-x-2"><PlusIcon className="h-5 w-5" /><span>{t('newTable')}</span></button>
            </div>
            <div className="mb-4 flex space-x-2 border-b">
                {activeZones.map(zone => (
                    <button key={zone} onClick={() => setActiveZone(zone)} className={`py-2 px-4 ${activeZone === zone ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>{zone}</button>
                ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {tables.filter(t => t.zone === activeZone).map(table => (
                    <div key={table.id} className="relative group">
                        <div className={`p-4 rounded-lg shadow-lg text-white border-b-4 ${getTableStatusColor(table.status)} flex flex-col items-center justify-center aspect-square`}>
                            <p className="text-3xl font-bold">{table.name}</p>
                            <div className="flex items-center space-x-1 mt-2"><UsersIcon className="h-5 w-5" /><span className="font-semibold">{table.capacity}</span></div>
                            <p className="text-sm mt-1">{table.status}</p>
                        </div>
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEditClick(table)} className="bg-black bg-opacity-40 p-1.5 rounded-full text-white hover:bg-opacity-60">
                                <EditIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDeleteClick(table.id)} className="bg-black bg-opacity-40 p-1.5 rounded-full text-white hover:bg-opacity-60">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ settings: Settings | null, onSave: (settings: Settings) => void, t: (key: keyof typeof translations['en']) => string; language: Language; onLanguageChange: (lang: Language) => void; }> = ({ settings: initialSettings, onSave, t, language, onLanguageChange }) => {
    const [settings, setSettings] = useState(initialSettings);
    useEffect(() => { setSettings(initialSettings); }, [initialSettings]);

    if (!settings) return <div>Loading settings...</div>;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value } : null);
    };

    const handleOpeningHoursChange = (day: string, field: string, value: string | boolean) => {
        setSettings(prev => prev ? { ...prev, openingHours: { ...prev.openingHours, [day]: { ...prev.openingHours[day], [field]: value } } } : null);
    };

    const handleZoneChange = (zone: Zone, isChecked: boolean) => {
        setSettings(prev => prev ? { ...prev, zones: { ...prev.zones, [zone]: isChecked } } : null);
    };

    const handleSave = () => { if(settings) onSave(settings); };

    const daysOfWeek: (keyof typeof translations['en'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('restaurantSettings')}</h1>
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 border-b pb-2">{t('languageSettings')}</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('language')}</label>
                        <select value={language} onChange={(e) => onLanguageChange(e.target.value as Language)} className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500">
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 border-b pb-2">{t('generalInformation')}</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">{t('restaurantName')}</label><input type="text" name="restaurantName" value={settings.restaurantName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div><div><label className="block text-sm font-medium text-gray-700">{t('email')}</label><input type="email" name="email" value={settings.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div><div><label className="block text-sm font-medium text-gray-700">{t('phone')}</label><input type="text" name="phone" value={settings.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div><div><label className="block text-sm font-medium text-gray-700">{t('address')}</label><input type="text" name="address" value={settings.address} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 border-b pb-2">{t('bookingRules')}</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="block text-sm font-medium text-gray-700">{t('maxDaysInAdvance')}</label><input type="number" name="maxBookingDays" value={settings.maxBookingDays} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div><div><label className="block text-sm font-medium text-gray-700">{t('defaultDurationMin')}</label><input type="number" name="defaultBookingDuration" value={settings.defaultBookingDuration} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div><div><label className="block text-sm font-medium text-gray-700">{t('maxPartySize')}</label><input type="number" name="maxPartySize" value={settings.maxPartySize} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div><div><label className="block text-sm font-medium text-gray-700">{t('walkInTables')}</label><input type="number" name="walkInTables" value={settings.walkInTables} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div></div></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 border-b pb-2">{t('zoneManagement')}</h2><div className="flex flex-wrap gap-x-6 gap-y-2">{Object.keys(settings.zones).map(zone => (<div key={zone} className="flex items-center"><input type="checkbox" id={`zone-${zone}`} checked={settings.zones[zone as Zone]} onChange={(e) => handleZoneChange(zone as Zone, e.target.checked)} className="h-4 w-4 rounded text-primary-600"/><label htmlFor={`zone-${zone}`} className="ml-2 text-sm text-gray-700 capitalize">{zone}</label></div>))}</div></div>
                <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 border-b pb-2">{t('openingHours')}</h2><div className="space-y-4">{settings && Object.entries(settings.openingHours).map(([day, hours], index) => {
                    const hoursData = hours as any;
                    return (<div key={day} className="grid grid-cols-3 md:grid-cols-6 items-center gap-4"><label className="font-medium capitalize col-span-3 md:col-span-1 text-gray-800">{t(daysOfWeek[index])}</label><div className="flex items-center space-x-2"><input type="checkbox" checked={hoursData.isOpen} onChange={(e) => handleOpeningHoursChange(day, 'isOpen', e.target.checked)} className="rounded text-primary-600"/><span className="text-sm text-gray-700">{t('open')}</span></div>{hoursData.isOpen && (<><div className="col-span-3 md:col-span-2"><label className="text-xs text-gray-500">{t('lunch')}</label><div className="flex items-center space-x-2"><input type="time" value={hoursData.lunchStart || ''} onChange={(e) => handleOpeningHoursChange(day, 'lunchStart', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/>
                                            <input type="time" value={hoursData.lunchEnd || ''} onChange={(e) => handleOpeningHoursChange(day, 'lunchEnd', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div></div><div className="col-span-3 md:col-span-2"><label className="text-xs text-gray-500">{t('dinner')}</label><div className="flex items-center space-x-2"><input type="time" value={hoursData.dinnerStart || ''} onChange={(e) => handleOpeningHoursChange(day, 'dinnerStart', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/><input type="time" value={hoursData.dinnerEnd || ''} onChange={(e) => handleOpeningHoursChange(day, 'dinnerEnd', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"/></div></div></>)}</div>);
                })}</div></div>
                <div className="flex justify-end"><button onClick={handleSave} className="bg-primary-600 text-white px-6 py-2 rounded-lg shadow hover:bg-primary-700">{t('saveChanges')}</button></div>
            </div>
        </div>
    );
};

const Sidebar: React.FC<{ currentPage: Page; onNavigate: (page: Page) => void, onLogout: () => void, t: (key: keyof typeof translations['en']) => string; }> = ({ currentPage, onNavigate, onLogout, t }) => {
    const navItems = [{ id: 'dashboard', label: t('dashboard'), icon: HomeIcon }, { id: 'reservations', label: t('reservations'), icon: CalendarIcon }, { id: 'tables', label: t('tables'), icon: TableIcon }, { id: 'settings', label: t('settings'), icon: CogIcon }];
    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0"><div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">REBOTLUTION</div>
            <nav className="flex-1 px-4 py-6 space-y-2">{navItems.map(item => (<button key={item.id} onClick={() => onNavigate(item.id as Page)} className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${ currentPage === item.id ? 'bg-primary-600' : 'hover:bg-gray-700' }`}><item.icon className="h-5 w-5" /><span>{item.label}</span></button>))}
            </nav>
            <div className="p-4 border-t border-gray-700"><button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-700"><LogoutIcon className="h-5 w-5"/><span>{t('logout')}</span></button></div>
        </aside>
    );
};

const LoginScreen: React.FC<{ onLogin: (password: string) => void; error: string | null; t: (key: keyof typeof translations['en']) => string; }> = ({ onLogin, error, t }) => {
    const [password, setPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onLogin(password); };
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">REBOTLUTION CRM</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('username')}</label>
                        <input type="text" value="admin" disabled className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 shadow-sm text-gray-400" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white text-gray-900" />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" className="w-full px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">{t('login')}</button>
                </form>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  t: (key: keyof typeof translations['en']) => string;
}> = ({ isOpen, onClose, onConfirm, title, message, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">{t('cancel')}</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{t('confirm')}</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [tableModalState, setTableModalState] = useState<ModalState>('none');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'reservation' | 'table' | null, id: string | number | null }>({ type: null, id: null });
  const [language, setLanguage] = useState<Language>('en');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Usar hooks personalizados para gestionar datos
  const {
    reservations,
    loading: reservationsLoading,
    error: reservationsError,
    todayReservations,
    filteredReservations,
    refreshReservations,
    addReservation,
    updateReservationData,
    deleteReservationData,
    updateReservationStatusData,
    markNotificationSentData,
    setFilter,
    currentFilter
  } = useReservations();

  const {
    tables,
    loading: tablesLoading,
    error: tablesError,
    availableTables,
    refreshTables,
    addTable,
    updateTableData,
    deleteTableData,
    updateTableStatusData
  } = useTables();

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    refreshSettings,
    updateSettingsData
  } = useSettings();

  // Estado de carga general
  const loading = reservationsLoading || tablesLoading || settingsLoading;
  const error = reservationsError || tablesError || settingsError;

  const t = (key: keyof typeof translations['en'], options?: { [key: string]: string | number }) => {
    let str = translations[language][key] || translations['en'][key];
    if (options) {
      Object.keys(options).forEach(optKey => {
        str = str.replace(`{${optKey}}`, String(options[optKey]));
      });
    }
    return str;
  };

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      refreshReservations();
      refreshTables();
      refreshSettings();
    }
  }, [isAuthenticated, refreshReservations, refreshTables, refreshSettings]);

  // Función para mostrar mensajes de éxito
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleLogin = (password: string) => {
    const adminPassword = process.env.ADMIN_PASSWORD || 'CHANGE_THIS_IN_PRODUCTION';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError(t('invalidPassword'));
    }
  };
  const handleLogout = () => setIsAuthenticated(false);

  const updateTableStatus = (tableId: number | undefined, status: TableStatus, tableList: Table[]) => {
      if (!tableId) return tableList;
      return tableList.map(t => t.id === tableId ? { ...t, status } : t);
  };
    
  const getTableStatusForReservation = (resStatus: ReservationStatus): TableStatus => {
      if (resStatus === ReservationStatus.Seated) return TableStatus.Occupied;
      if (resStatus === ReservationStatus.Completed || resStatus === ReservationStatus.Cancelled) return TableStatus.Available;
      return TableStatus.Reserved;
  };
    
  const handleAddReservation = async (newReservationData: Reservation) => {
    const newReservation = await addReservation(newReservationData);
    if (newReservation) {
      showSuccessMessage(t('settingsSaved')); // Reusing translation for success message
      if (newReservation.tableId) {
        const newStatus = getTableStatusForReservation(newReservation.status);
        await updateTableStatusData(newReservation.tableId, newStatus);
      }
    }
  };

  const handleUpdateReservation = async (updatedReservation: Reservation) => {
    const oldReservation = reservations.find(r => r.id === updatedReservation.id);
    if (!oldReservation) return;

    // If table assignment changed, free up old table
    if (oldReservation.tableId && oldReservation.tableId !== updatedReservation.tableId) {
      await updateTableStatusData(oldReservation.tableId, TableStatus.Available);
    }

    // Update reservation
    const success = await updateReservationData(updatedReservation.id, updatedReservation);
    if (success) {
      showSuccessMessage(t('settingsSaved')); // Reusing translation for success message
      
      // Update new table status
      if (updatedReservation.tableId) {
        const newStatus = getTableStatusForReservation(updatedReservation.status);
        await updateTableStatusData(updatedReservation.tableId, newStatus);
      }
    }
  };

  const handleMarkAsNotified = async (reservationId: string) => {
    const success = await markNotificationSentData(reservationId);
    if (success) {
      showSuccessMessage(t('settingsSaved'));
    }
  };

  const handleDeleteReservation = (reservationId: string) => {
    setDeleteConfirmation({ type: 'reservation', id: reservationId });
  };
  
  const handleNewTableClick = () => setTableModalState('create');
  const handleEditTableClick = (table: Table) => { setSelectedTable(table); setTableModalState('edit'); };
  const handleCloseTableModal = () => { setTableModalState('none'); setSelectedTable(null); };

  const handleSaveTable = async (tableData: Table) => {
      let success = false;
      
      if (tableModalState === 'create') {
          const newTable = await addTable({ ...tableData, status: TableStatus.Available });
          success = !!newTable;
      } else if (tableModalState === 'edit' && selectedTable) {
          const updatedTable = await updateTableData(selectedTable.id, tableData);
          success = !!updatedTable;
      }
      
      if (success) {
        showSuccessMessage(t('settingsSaved')); // Reusing translation for success message
        handleCloseTableModal();
      }
  };

  const handleDeleteTable = (tableId: number) => {
    setDeleteConfirmation({ type: 'table', id: tableId });
  };
  
  const handleConfirmDelete = async () => {
    const { type, id } = deleteConfirmation;
    let success = false;
    
    if (type === 'reservation' && typeof id === 'string') {
        const reservationToDelete = reservations.find(r => r.id === id);
        if (reservationToDelete?.tableId) {
            await updateTableStatusData(reservationToDelete.tableId, TableStatus.Available);
        }
        success = await deleteReservationData(id);
    } else if (type === 'table' && typeof id === 'number') {
        const tableToDelete = tables.find(t => t.id === id);
        if (tableToDelete?.status !== TableStatus.Available) {
            alert(t('cannotDeleteTable'));
        } else {
            // Update reservations that reference this table
            for (const reservation of reservations.filter(r => r.tableId === id)) {
              await updateReservationData(reservation.id, { tableId: undefined });
            }
            success = await deleteTableData(id);
        }
    }
    
    if (success) {
      showSuccessMessage(t('settingsSaved')); // Reusing translation for success message
    }
    
    setDeleteConfirmation({ type: null, id: null });
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    const success = await updateSettingsData(newSettings);
    if (success) {
      showSuccessMessage(t('settingsSaved'));
    }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} error={loginError} t={t} />;

  const renderPage = () => {
    if (loading) return <div className="flex items-center justify-center h-full text-xl font-semibold text-gray-600">{t('loadingCRM')}</div>;
    if (error) return <div className="flex items-center justify-center h-full text-xl text-red-600 bg-red-50 p-10 rounded-lg">{error}</div>;
    switch (currentPage) {
      case 'dashboard': return <DashboardView reservations={reservations} tables={tables} t={t} />;
      case 'reservations': return <ReservationsView reservations={reservations} filteredReservations={filteredReservations} onAdd={handleAddReservation} onUpdate={handleUpdateReservation} onDelete={handleDeleteReservation} onMarkAsNotified={handleMarkAsNotified} tables={tables} setFilter={setFilter} currentFilter={currentFilter} t={t} />;
      case 'tables': return <TablesView tables={tables} settings={settings} onNewClick={handleNewTableClick} onEditClick={handleEditTableClick} onDeleteClick={handleDeleteTable} t={t} />;
      case 'settings': return <SettingsView settings={settings} onSave={handleSaveSettings} t={t} language={language} onLanguageChange={setLanguage} />;
      default: return <DashboardView reservations={reservations} tables={tables} t={t} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} t={t} />
      <main className="flex-1 p-8 overflow-y-auto">
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        {renderPage()}
      </main>
      
      {tableModalState !== 'none' && settings && (
          <TableModal
              isOpen={true}
              onClose={handleCloseTableModal}
              onSave={handleSaveTable}
              table={selectedTable}
              mode={tableModalState}
              zones={(Object.keys(settings.zones) as Zone[]).filter(zone => settings.zones[zone])}
              t={t}
          />
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.type !== null}
        onClose={() => setDeleteConfirmation({ type: null, id: null })}
        onConfirm={handleConfirmDelete}
        title={t('deleteConfirmationTitle', { type: deleteConfirmation.type || '' })}
        message={t('deleteConfirmationMessage', { type: deleteConfirmation.type || '' })}
        t={t}
      />
    </div>
  );
}
