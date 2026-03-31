import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import type {
  AnalyticsOverview,
  Appointment,
  CreateAppointment,
  CreatePatient,
  DiseaseTrendPoint,
  Doctor,
  HealthStatus,
  Patient,
  PredictionInput,
  PredictionResult,
} from "./api.schemas";

import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";

type AwaitedInput<T> = PromiseLike<T> | T;

type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

/**
 * @summary Health check
 */
export const getHealthCheckUrl = () => {
  return `/api/healthz`;
};

export const healthCheck = async (
  options?: RequestInit,
): Promise<HealthStatus> => {
  return customFetch<HealthStatus>(getHealthCheckUrl(), {
    ...options,
    method: "GET",
  });
};

export const getHealthCheckQueryKey = () => {
  return [`/api/healthz`] as const;
};

export const getHealthCheckQueryOptions = <
  TData = Awaited<ReturnType<typeof healthCheck>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof healthCheck>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof healthCheck>>> = ({
    signal,
  }) => healthCheck({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof healthCheck>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type HealthCheckQueryResult = NonNullable<
  Awaited<ReturnType<typeof healthCheck>>
>;
export type HealthCheckQueryError = ErrorType<unknown>;

/**
 * @summary Health check
 */

export function useHealthCheck<
  TData = Awaited<ReturnType<typeof healthCheck>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof healthCheck>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}

/**
 * @summary List all patients
 */
export const getListPatientsUrl = () => {
  return `/api/patients`;
};

export const listPatients = async (
  options?: RequestInit,
): Promise<Patient[]> => {
  return customFetch<Patient[]>(getListPatientsUrl(), {
    ...options,
    method: "GET",
  });
};

export const getListPatientsQueryKey = () => {
  return [`/api/patients`] as const;
};

export const getListPatientsQueryOptions = <
  TData = Awaited<ReturnType<typeof listPatients>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listPatients>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getListPatientsQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof listPatients>>> = ({
    signal,
  }) => listPatients({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listPatients>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListPatientsQueryResult = NonNullable<
  Awaited<ReturnType<typeof listPatients>>
>;
export type ListPatientsQueryError = ErrorType<unknown>;

/**
 * @summary List all patients
 */

export function useListPatients<
  TData = Awaited<ReturnType<typeof listPatients>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listPatients>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListPatientsQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}

/**
 * @summary Create a patient
 */
export const getCreatePatientUrl = () => {
  return `/api/patients`;
};

export const createPatient = async (
  createPatient: CreatePatient,
  options?: RequestInit,
): Promise<Patient> => {
  return customFetch<Patient>(getCreatePatientUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(createPatient),
  });
};

export const getCreatePatientMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createPatient>>,
    TError,
    { data: BodyType<CreatePatient> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof createPatient>>,
  TError,
  { data: BodyType<CreatePatient> },
  TContext
> => {
  const mutationKey = ["createPatient"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createPatient>>,
    { data: BodyType<CreatePatient> }
  > = (props) => {
    const { data } = props ?? {};

    return createPatient(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type CreatePatientMutationResult = NonNullable<
  Awaited<ReturnType<typeof createPatient>>
>;
export type CreatePatientMutationBody = BodyType<CreatePatient>;
export type CreatePatientMutationError = ErrorType<unknown>;

/**
 * @summary Create a patient
 */
export const useCreatePatient = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createPatient>>,
    TError,
    { data: BodyType<CreatePatient> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createPatient>>,
  TError,
  { data: BodyType<CreatePatient> },
  TContext
> => {
  return useMutation(getCreatePatientMutationOptions(options));
};

/**
 * @summary Get patient by ID
 */
export const getGetPatientUrl = (id: number) => {
  return `/api/patients/${id}`;
};

export const getPatient = async (
  id: number,
  options?: RequestInit,
): Promise<Patient> => {
  return customFetch<Patient>(getGetPatientUrl(id), {
    ...options,
    method: "GET",
  });
};

export const getGetPatientQueryKey = (id: number) => {
  return [`/api/patients/${id}`] as const;
};

export const getGetPatientQueryOptions = <
  TData = Awaited<ReturnType<typeof getPatient>>,
  TError = ErrorType<unknown>,
>(
  id: number,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getPatient>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetPatientQueryKey(id);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getPatient>>> = ({
    signal,
  }) => getPatient(id, { signal, ...requestOptions });

  return {
    queryKey,
    queryFn,
    enabled: !!id,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof getPatient>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type GetPatientQueryResult = NonNullable<
  Awaited<ReturnType<typeof getPatient>>
>;
export type GetPatientQueryError = ErrorType<unknown>;

/**
 * @summary Get patient by ID
 */

export function useGetPatient<
  TData = Awaited<ReturnType<typeof getPatient>>,
  TError = ErrorType<unknown>,
>(
  id: number,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof getPatient>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetPatientQueryOptions(id, options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}

/**
 * @summary List all doctors
 */
export const getListDoctorsUrl = () => {
  return `/api/doctors`;
};

export const listDoctors = async (options?: RequestInit): Promise<Doctor[]> => {
  return customFetch<Doctor[]>(getListDoctorsUrl(), {
    ...options,
    method: "GET",
  });
};

export const getListDoctorsQueryKey = () => {
  return [`/api/doctors`] as const;
};

export const getListDoctorsQueryOptions = <
  TData = Awaited<ReturnType<typeof listDoctors>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listDoctors>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getListDoctorsQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof listDoctors>>> = ({
    signal,
  }) => listDoctors({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listDoctors>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListDoctorsQueryResult = NonNullable<
  Awaited<ReturnType<typeof listDoctors>>
>;
export type ListDoctorsQueryError = ErrorType<unknown>;

/**
 * @summary List all doctors
 */

export function useListDoctors<
  TData = Awaited<ReturnType<typeof listDoctors>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listDoctors>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListDoctorsQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}

/**
 * @summary List all appointments
 */
export const getListAppointmentsUrl = () => {
  return `/api/appointments`;
};

export const listAppointments = async (
  options?: RequestInit,
): Promise<Appointment[]> => {
  return customFetch<Appointment[]>(getListAppointmentsUrl(), {
    ...options,
    method: "GET",
  });
};

export const getListAppointmentsQueryKey = () => {
  return [`/api/appointments`] as const;
};

export const getListAppointmentsQueryOptions = <
  TData = Awaited<ReturnType<typeof listAppointments>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listAppointments>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getListAppointmentsQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listAppointments>>
  > = ({ signal }) => listAppointments({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listAppointments>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type ListAppointmentsQueryResult = NonNullable<
  Awaited<ReturnType<typeof listAppointments>>
>;
export type ListAppointmentsQueryError = ErrorType<unknown>;

/**
 * @summary List all appointments
 */

export function useListAppointments<
  TData = Awaited<ReturnType<typeof listAppointments>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listAppointments>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListAppointmentsQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}

/**
 * @summary Create appointment
 */
export const getCreateAppointmentUrl = () => {
  return `/api/appointments`;
};

export const createAppointment = async (
  createAppointment: CreateAppointment,
  options?: RequestInit,
): Promise<Appointment> => {
  return customFetch<Appointment>(getCreateAppointmentUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(createAppointment),
  });
};

export const getCreateAppointmentMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createAppointment>>,
    TError,
    { data: BodyType<CreateAppointment> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof createAppointment>>,
  TError,
  { data: BodyType<CreateAppointment> },
  TContext
> => {
  const mutationKey = ["createAppointment"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createAppointment>>,
    { data: BodyType<CreateAppointment> }
  > = (props) => {
    const { data } = props ?? {};

    return createAppointment(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type CreateAppointmentMutationResult = NonNullable<
  Awaited<ReturnType<typeof createAppointment>>
>;
export type CreateAppointmentMutationBody = BodyType<CreateAppointment>;
export type CreateAppointmentMutationError = ErrorType<unknown>;

/**
 * @summary Create appointment
 */
export const useCreateAppointment = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createAppointment>>,
    TError,
    { data: BodyType<CreateAppointment> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createAppointment>>,
  TError,
  { data: BodyType<CreateAppointment> },
  TContext
> => {
  return useMutation(getCreateAppointmentMutationOptions(options));
};

/**
 * @summary Run AI disease prediction
 */
export const getPredictDiseaseUrl = () => {
  return `/api/predictions`;
};

export const predictDisease = async (
  predictionInput: PredictionInput,
  options?: RequestInit,
): Promise<PredictionResult> => {
  return customFetch<PredictionResult>(getPredictDiseaseUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(predictionInput),
  });
};

export const getPredictDiseaseMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof predictDisease>>,
    TError,
    { data: BodyType<PredictionInput> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof predictDisease>>,
  TError,
  { data: BodyType<PredictionInput> },
  TContext
> => {
  const mutationKey = ["predictDisease"];
  const { mutation: mutationOptions, request: requestOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, request: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof predictDisease>>,
    { data: BodyType<PredictionInput> }
  > = (props) => {
    const { data } = props ?? {};

    return predictDisease(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type PredictDiseaseMutationResult = NonNullable<
  Awaited<ReturnType<typeof predictDisease>>
>;
export type PredictDiseaseMutationBody = BodyType<PredictionInput>;
export type PredictDiseaseMutationError = ErrorType<unknown>;

/**
 * @summary Run AI disease prediction
 */
export const usePredictDisease = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof predictDisease>>,
    TError,
    { data: BodyType<PredictionInput> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof predictDisease>>,
  TError,
  { data: BodyType<PredictionInput> },
  TContext
> => {
  return useMutation(getPredictDiseaseMutationOptions(options));
};

/**
 * @summary Get analytics overview stats
 */
export const getGetAnalyticsOverviewUrl = () => {
  return `/api/analytics/overview`;
};

export const getAnalyticsOverview = async (
  options?: RequestInit,
): Promise<AnalyticsOverview> => {
  return customFetch<AnalyticsOverview>(getGetAnalyticsOverviewUrl(), {
    ...options,
    method: "GET",
  });
};

export const getGetAnalyticsOverviewQueryKey = () => {
  return [`/api/analytics/overview`] as const;
};

export const getGetAnalyticsOverviewQueryOptions = <
  TData = Awaited<ReturnType<typeof getAnalyticsOverview>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getAnalyticsOverview>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetAnalyticsOverviewQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getAnalyticsOverview>>
  > = ({ signal }) => getAnalyticsOverview({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getAnalyticsOverview>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type GetAnalyticsOverviewQueryResult = NonNullable<
  Awaited<ReturnType<typeof getAnalyticsOverview>>
>;
export type GetAnalyticsOverviewQueryError = ErrorType<unknown>;

/**
 * @summary Get analytics overview stats
 */

export function useGetAnalyticsOverview<
  TData = Awaited<ReturnType<typeof getAnalyticsOverview>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getAnalyticsOverview>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetAnalyticsOverviewQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}

/**
 * @summary Get disease trend data
 */
export const getGetDiseaseTrendsUrl = () => {
  return `/api/analytics/disease-trends`;
};

export const getDiseaseTrends = async (
  options?: RequestInit,
): Promise<DiseaseTrendPoint[]> => {
  return customFetch<DiseaseTrendPoint[]>(getGetDiseaseTrendsUrl(), {
    ...options,
    method: "GET",
  });
};

export const getGetDiseaseTrendsQueryKey = () => {
  return [`/api/analytics/disease-trends`] as const;
};

export const getGetDiseaseTrendsQueryOptions = <
  TData = Awaited<ReturnType<typeof getDiseaseTrends>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getDiseaseTrends>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetDiseaseTrendsQueryKey();

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof getDiseaseTrends>>
  > = ({ signal }) => getDiseaseTrends({ signal, ...requestOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getDiseaseTrends>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export type GetDiseaseTrendsQueryResult = NonNullable<
  Awaited<ReturnType<typeof getDiseaseTrends>>
>;
export type GetDiseaseTrendsQueryError = ErrorType<unknown>;

/**
 * @summary Get disease trend data
 */

export function useGetDiseaseTrends<
  TData = Awaited<ReturnType<typeof getDiseaseTrends>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof getDiseaseTrends>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetDiseaseTrendsQueryOptions(options);

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };

  return { ...query, queryKey: queryOptions.queryKey };
}
