--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)

-- Started on 2026-10-18 15:56:59 -03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 848 (class 1247 OID 25878)
-- Name: charge_frequency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.charge_frequency_enum AS ENUM (
    'quinzenal',
    'mensal'
);


ALTER TYPE public.charge_frequency_enum OWNER TO postgres;

--
-- TOC entry 839 (class 1247 OID 25848)
-- Name: customer_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.customer_type_enum AS ENUM (
    'residencia',
    'condominio',
    'sitio ou chacara',
    'clube',
    'hoteis e resorts',
    'academias'
);


ALTER TYPE public.customer_type_enum OWNER TO postgres;

--
-- TOC entry 833 (class 1247 OID 25831)
-- Name: document_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_type_enum AS ENUM (
    'CPF',
    'CNPJ'
);


ALTER TYPE public.document_type_enum OWNER TO postgres;

--
-- TOC entry 851 (class 1247 OID 25884)
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pendente',
    'pago'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- TOC entry 836 (class 1247 OID 25836)
-- Name: pool_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.pool_type_enum AS ENUM (
    'fibra',
    'vinil',
    'alvenaria',
    'azulejo',
    'pastilha'
);


ALTER TYPE public.pool_type_enum OWNER TO postgres;

--
-- TOC entry 842 (class 1247 OID 25862)
-- Name: service_frequency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_frequency_enum AS ENUM (
    'semanal',
    'quinzenal',
    'mensal'
);


ALTER TYPE public.service_frequency_enum OWNER TO postgres;

--
-- TOC entry 845 (class 1247 OID 25870)
-- Name: service_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_status_enum AS ENUM (
    'agendado',
    'concluido',
    'cancelado'
);


ALTER TYPE public.service_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 212 (class 1259 OID 25900)
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    address_id integer NOT NULL,
    street character varying(150) NOT NULL,
    number character varying(10),
    neighborhood character varying(150),
    city character varying(150),
    complement character varying(150)
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 25899)
-- Name: addresses_address_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.addresses ALTER COLUMN address_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.addresses_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 25967)
-- Name: charges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charges (
    charge_id integer NOT NULL,
    customer_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_frequency public.charge_frequency_enum,
    payment_status public.payment_status_enum DEFAULT 'pendente'::public.payment_status_enum NOT NULL,
    CONSTRAINT charges_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.charges OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 25966)
-- Name: charges_charge_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.charges ALTER COLUMN charge_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.charges_charge_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 214 (class 1259 OID 25906)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    address_id integer NOT NULL,
    name character varying(150) NOT NULL,
    phone character varying(20),
    document_type public.document_type_enum,
    document_number character varying(18)
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 25905)
-- Name: customers_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customers ALTER COLUMN customer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customers_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 216 (class 1259 OID 25922)
-- Name: pools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pools (
    pool_id integer NOT NULL,
    customer_id integer NOT NULL,
    address_id integer NOT NULL,
    description character varying(255) NOT NULL,
    pool_type public.pool_type_enum NOT NULL,
    customer_type public.customer_type_enum NOT NULL,
    width numeric(10,2),
    length numeric(10,2),
    depth numeric(10,2),
    volume numeric(10,2),
    last_sand_change date,
    has_heating boolean DEFAULT false NOT NULL,
    has_ozone_treatment boolean DEFAULT false NOT NULL,
    has_waterfall boolean DEFAULT false NOT NULL,
    has_hydromassage boolean DEFAULT false NOT NULL,
    has_led_lighting boolean DEFAULT false NOT NULL,
    has_infinity_edge boolean DEFAULT false NOT NULL,
    has_timer boolean DEFAULT false NOT NULL,
    has_uv_treatment boolean DEFAULT false NOT NULL
);


ALTER TABLE public.pools OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 25921)
-- Name: pools_pool_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.pools ALTER COLUMN pool_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pools_pool_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 25946)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    service_id integer NOT NULL,
    customer_id integer NOT NULL,
    pool_id integer NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone NOT NULL,
    description character varying(500) NOT NULL,
    recurrence boolean DEFAULT false NOT NULL,
    recurrence_frequency public.service_frequency_enum,
    recurrence_months smallint,
    status public.service_status_enum DEFAULT 'agendado'::public.service_status_enum NOT NULL,
    execution_date date,
    CONSTRAINT services_recurrence_months_check CHECK ((recurrence_months > 0))
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 25945)
-- Name: services_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.services ALTER COLUMN service_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.services_service_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 210 (class 1259 OID 25890)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    reset_token character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 25889)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3272 (class 2606 OID 25904)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (address_id);


--
-- TOC entry 3280 (class 2606 OID 25974)
-- Name: charges charges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_pkey PRIMARY KEY (charge_id);


--
-- TOC entry 3274 (class 2606 OID 25910)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- TOC entry 3276 (class 2606 OID 25934)
-- Name: pools pools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_pkey PRIMARY KEY (pool_id);


--
-- TOC entry 3278 (class 2606 OID 25955)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- TOC entry 3268 (class 2606 OID 25898)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3270 (class 2606 OID 25896)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3286 (class 2606 OID 25975)
-- Name: charges charges_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charges
    ADD CONSTRAINT charges_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE RESTRICT;


--
-- TOC entry 3281 (class 2606 OID 25916)
-- Name: customers customers_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(address_id) ON DELETE RESTRICT;


--
-- TOC entry 3283 (class 2606 OID 25940)
-- Name: pools pools_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(address_id) ON DELETE RESTRICT;


--
-- TOC entry 3282 (class 2606 OID 25935)
-- Name: pools pools_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE;


--
-- TOC entry 3284 (class 2606 OID 25956)
-- Name: services services_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE RESTRICT;


--
-- TOC entry 3285 (class 2606 OID 25961)
-- Name: services services_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pools(pool_id) ON DELETE RESTRICT;


-- Completed on 2026-10-18 15:56:59 -03

--
-- PostgreSQL database dump complete
--

