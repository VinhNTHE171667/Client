"use client";

import type React from "react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Typography,
  message,
  Spin,
  Alert,
  Select,
  Modal,
  List,
  Avatar,
} from "antd";
import { ArrowLeft, RotateCcw, ShoppingCart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./Cart.module.scss";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import { configRoutes } from "@/constants/route";
import {
  useDeleteFromCartMutation,
  useGetCartMutation,
  useAddToCartMutation,
  type CartItemData,
} from "@/services/cart";
import { showError } from "@/libs/toast";
import staticServices from "@/services.json";
import serviceMap from "@/serviceMap.json";
import {
  useGetServiceByIdQuery,
  useGetPublicServicesMutation,
  useGetPublicServiceByIdQuery,
} from "@/services/services";
import { axiosPublic } from "@/libs/axios/axiosPublic";
import { useAuthStore } from "@/hooks/UseAuth";
import {
  getCustomerRecommendations,
  getServiceRecommendations,
  getCartRecommendations,
  type RecommendationItem,
} from "@/services/recommendation";
const { Title, Text } = Typography;

const CartPage = () => {
  const navigate = useNavigate();
  const { auth } = useAuthStore();
  const isMountedRef = useRef(true);

  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  // const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const [getCart] = useGetCartMutation();
  const [deleteFromCart] = useDeleteFromCartMutation();
  const [getPublicServices] = useGetPublicServicesMutation();

  const [addToCartMutation] = useAddToCartMutation();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(
    []
  );
  const [suggestCount, setSuggestCount] = useState<number>(3);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null
  );
  const [lastFetchStatus, setLastFetchStatus] = useState<string | null>(null);
  const [addingRecommendationId, setAddingRecommendationId] = useState<
    string | null
  >(null);
  const [doctorModalVisible, setDoctorModalVisible] = useState(false);
  const [pendingItemToAdd, setPendingItemToAdd] = useState<{
    uuid: string;
    item: RecommendationItem;
  } | null>(null);
  const [selectedDoctorModalId, setSelectedDoctorModalId] = useState<
    string | null
  >(null);
  // Cache for services fetched from backend by UUID. Keys are service UUIDs.
  const [remoteServices, setRemoteServices] = useState<Record<string, any>>({});

  // Resolve a recommendation item to its UUID
  // Priority: 1) serviceUuid if valid UUID, 2) serviceId if valid UUID format, 3) fallback to serviceMap for numeric IDs
  const resolveServiceUuid = useCallback(
    (
      raw:
        | RecommendationItem
        | { serviceId?: any; serviceUuid?: any; serviceName?: any }
        | null
    ): string | null => {
      if (!raw) return null;

      // First check serviceUuid field - if it looks like a UUID, use it directly
      const maybeUuid = String((raw as any).serviceUuid ?? "");
      if (maybeUuid && maybeUuid.includes("-") && maybeUuid.length > 30)
        return maybeUuid;

      // Check if serviceId itself is already a UUID (recommender may return UUIDs in serviceId field)
      const maybeId = String((raw as any).serviceId ?? "");
      if (maybeId && maybeId.includes("-") && maybeId.length > 30)
        return maybeId;

      // Fallback: try to map numeric serviceId using serviceMap.json
      if (
        maybeId &&
        /^\d+$/.test(maybeId) &&
        (serviceMap as Record<string, string>)[maybeId]
      ) {
        return (serviceMap as Record<string, string>)[maybeId];
      }

      // Last resort: parse from serviceName like "Service 12"
      const name = String((raw as any).serviceName ?? (raw as any).name ?? "");
      const m = name.match(/Service\s*(\d+)/i);
      if (m && m[1] && (serviceMap as Record<string, string>)[m[1]]) {
        return (serviceMap as Record<string, string>)[m[1]];
      }

      return null;
    },
    []
  );

  // Small cache is handled by service query hook per item via SuggestionTitle

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // build reverse mapping uuid -> seqId for recommender lookup
  const reverseServiceMap = useMemo(() => {
    try {
      const map = Object.entries(serviceMap as Record<string, string>).reduce<
        Record<string, string>
      >((acc, [k, v]) => {
        if (v) acc[v] = k;
        return acc;
      }, {});
      console.debug(
        "[recommendation] reverseServiceMap created with",
        Object.keys(map).length,
        "entries"
      );
      return map;
    } catch (e) {
      console.error("[recommendation] failed to create reverseServiceMap", e);
      return {};
    }
  }, []);

  const extractUuidFromCartItem = useCallback(
    (item: CartItemData): string | undefined => {
      if (!item) return undefined;
      if (item.id) {
        const v = String(item.id);
        console.debug(
          "[recommendation] extractUuidFromCartItem found id:",
          v,
          "reverseMap->",
          reverseServiceMap[v]
        );
        return v;
      }
      // @ts-ignore
      if ((item as any).serviceUuid) return String((item as any).serviceUuid);
      // @ts-ignore
      if ((item as any).uuid) return String((item as any).uuid);
      // @ts-ignore
      if ((item as any).service && (item as any).service.id)
        return String((item as any).service.id);
      return undefined;
    },
    [reverseServiceMap]
  );

  const loadRecommendations = useCallback(async () => {
    console.debug(
      "[recommendation] ====== loadRecommendations FUNCTION ENTERED ======"
    );
    console.debug(
      "[recommendation] isMountedRef.current:",
      isMountedRef.current
    );
    setLastFetchStatus("loading:started");

    if (!isMountedRef.current) {
      console.warn("[recommendation] component unmounted, skipping");
      return;
    }

    console.debug(
      "[recommendation] auth?.accountId:",
      auth?.accountId,
      "cartItems.length:",
      cartItems.length
    );
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    setLastFetchStatus("loading:processing");
    try {
      let res = null;
      
      // PRIORITY 1: If there are services in cart, use cart-based co-occurrence recommendations
      if (cartItems && cartItems.length > 0) {
        console.debug("[recommendation] extracting service IDs from cart items");
        const cartServiceIds: (string | number)[] = [];
        
        for (const item of cartItems) {
          const serviceUuid = extractUuidFromCartItem(item);
          if (serviceUuid) {
            // Send UUID directly to backend (database uses UUIDs for service_id)
            cartServiceIds.push(serviceUuid);
          }
        }
        
        console.debug("[recommendation] cart service IDs:", cartServiceIds);
        
        if (cartServiceIds.length > 0) {
          try {
            console.debug(
              "[recommendation] fetching cart-based recommendations for",
              cartServiceIds.length,
              "services"
            );
            setLastFetchStatus(`cart:${cartServiceIds.length}`);
            res = await getCartRecommendations(cartServiceIds, {
              limit: suggestCount,
            });
            console.debug(
              "[recommendation] cart-based response items:",
              res?.items?.length ?? 0
            );
            setLastFetchStatus(
              (res?.items?.length ?? 0) > 0
                ? `cart:ok`
                : `cart:empty`
            );
          } catch (e) {
            console.warn(
              "cart-based recs failed, falling back to customer recs",
              e
            );
            setLastFetchStatus(`cart:error`);
            res = null;
          }
        }
      }

      // PRIORITY 2: Fallback to customer-based recommendations if cart API failed or cart is empty
      if (!res) {
        const customerId = auth?.accountId ? String(auth.accountId) : "1";

        console.debug(
          "[recommendation] fetching customer-based recommendations for",
          customerId
        );
        setLastFetchStatus("customer:fetching");
        res = await getCustomerRecommendations(customerId, {
          limit: suggestCount,
        });
        setLastFetchStatus(
          (res?.items?.length ?? 0) > 0 ? "customer:ok" : "customer:empty"
        );
      }

      if (!isMountedRef.current) return;
      console.debug(
        "[recommendation] setting recommendations, items count:",
        res.items?.length ?? 0
      );
      setRecommendations(res.items ?? []);
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[recommendation] load error:", msg, err);
      setLastFetchStatus(`error:${msg}`);
      setRecommendationError(msg);
    } finally {
      if (isMountedRef.current) {
        console.debug("[recommendation] load completed");
        setIsLoadingRecommendations(false);
      }
    }
  }, [
    auth?.accountId,
    suggestCount,
    cartItems,
    extractUuidFromCartItem,
    reverseServiceMap,
  ]);

  // Auto-load recommendations when cart changes (after user adds/removes services)
  useEffect(() => {
    if (cartItems.length > 0) {
      console.debug(
        "[recommendation] cartItems changed, auto-loading recommendations"
      );
      void loadRecommendations();
    } else {
      // Clear recommendations when cart is empty
      console.debug("[recommendation] cart empty, clearing recommendations");
      setRecommendations([]);
      setLastFetchStatus("cart:empty");
    }
  }, [cartItems, loadRecommendations]);

  // Recommendations are loaded only when the user requests (clicks "Làm mới").
  // Changing `suggestCount` does not automatically reload recommendations.

  const handleGetCart = useCallback(async () => {
    if (!auth?.accountId) {
      setCartItems([]);
      return;
    }

    try {
      const cart = await getCart(String(auth.accountId)).unwrap();
      setCartItems([]);
      setCartItems(cart?.items || []);
    } catch {
      showError("Lấy giỏ hàng thất bại!");
    }
  }, [auth?.accountId, getCart]);

  useEffect(() => {
    void handleGetCart();
  }, [handleGetCart]);

  const handleDeleteFromCart = async (itemId: string) => {
    try {
      // Single call to avoid duplicate request and follow-up racing states.
      await deleteFromCart({
        customerId: auth?.accountId || "",
        itemId,
      }).unwrap();
      message.success("Xóa dịch vụ thành công!");
      await handleGetCart();
    } catch {
      showError("Xóa dịch vụ thất bại!");
    }
  };

  const handleAddRecommendation = async (item: RecommendationItem) => {
    if (!auth?.accountId) {
      message.warning("Bạn cần đăng nhập để thêm dịch vụ gợi ý!");
      return;
    }
    // Resolve service UUID first (critical) using shared resolver
    const resolvedUuid = resolveServiceUuid(item);
    if (!resolvedUuid) {
      message.warning(
        "Không xác định được dịch vụ thực (UUID). Vui lòng thử lại."
      );
      return;
    }

    // Auto-detect doctor: use item's doctorId, or selectedDoctorId, or first doctor in cart
    let doctorId = item.doctorId ? String(item.doctorId) : selectedDoctorId;
    if (!doctorId && cartItems.length > 0) {
      const firstDoctor = cartItems[0]?.doctor?.id;
      if (firstDoctor) {
        doctorId = String(firstDoctor);
        console.debug(
          "[cart] auto-selected doctor from first cart item:",
          doctorId
        );
      }
    }

    // If still no doctorId, open modal to let user pick a doctor (conservative UX)
    if (!doctorId) {
      setPendingItemToAdd({ uuid: resolvedUuid, item });
      setSelectedDoctorModalId(null);
      setDoctorModalVisible(true);
      return;
    }

    try {
      console.debug("[cart] adding recommendation to cart (resolvedUuid):", {
        resolvedUuid,
        doctorId,
        customerId: auth.accountId,
      });
      setAddingRecommendationId(resolvedUuid);

      await addToCartMutation({
        customerId: String(auth.accountId),
        doctorId,
        itemData: { itemId: resolvedUuid, quantity: 1 },
      }).unwrap();

      // Fetch the real service object and cache it so UI shows real name/price immediately
      try {
        const svcRes = await axiosPublic.get(`/service/${resolvedUuid}`);
        if (svcRes?.data?.id) {
          setRemoteServices((prev) => ({
            ...prev,
            [svcRes.data.id]: svcRes.data,
          }));
        }
      } catch (e) {
        console.debug("[cart] fetch service after add failed", e);
      }

      message.success(`Đã thêm "${item.serviceName || "Dịch vụ"}" vào giỏ!`);
      await handleGetCart();
      // Recommendations will auto-reload via useEffect when cartItems changes
    } catch (err) {
      console.error("[cart] failed to add recommendation:", err);
      const errorMsg =
        (err as any)?.data?.message ||
        (err as Error)?.message ||
        "Không thể thêm dịch vụ";
      message.error(`Thêm thất bại: ${errorMsg}`);
    } finally {
      setAddingRecommendationId(null);
    }
  };

  const groupedByDoctor = useMemo(() => {
    const groups: Record<string, CartItemData[]> = {};
    cartItems.forEach((item) => {
      const docId = item.doctor?.id || "no-doctor";
      if (!groups[docId]) groups[docId] = [];
      groups[docId].push(item);
    });
    return groups;
  }, [cartItems]);

  const [publicFallback, setPublicFallback] = useState<RecommendationItem[]>(
    []
  );

  useEffect(() => {
    // If recommendations empty, fetch public services to display real DB data
    if (
      (recommendations && recommendations.length > 0) ||
      cartItems.length === 0
    ) {
      setPublicFallback([]);
      return;
    }

    let mounted = true;

    const loadPublic = async () => {
      try {
        const res = await getPublicServices().unwrap();
        if (!mounted) return;
        const inCartUuids = new Set(cartItems.map((i) => String(i.id)));
        const list = (res || [])
          .filter((s) => !inCartUuids.has(String(s.id)))
          .slice(0, 6)
          .map((s) => ({
            serviceId: s.id,
            serviceUuid: s.id,
            serviceName: s.name,
            price: s.price,
            reason: "fallback",
          }));
        setPublicFallback(list);
      } catch (err) {
        // Fallback to static if public fetch fails
        const inCartUuids = new Set(cartItems.map((i) => String(i.id)));
        const list = (staticServices || [])
          .filter((s) => !inCartUuids.has(String(s.id)))
          .slice(0, 6)
          .map((s) => ({
            serviceId: s.id,
            serviceUuid: s.id,
            serviceName: s.name,
            price: s.price,
            reason: "fallback",
          }));
        setPublicFallback(list);
      }
    };

    void loadPublic();
    return () => {
      mounted = false;
    };
  }, [recommendations, cartItems, getPublicServices]);

  const fallbackRecommendations = useMemo(() => {
    // Use static services as fallback suggestions when backend returns none
    if (recommendations && recommendations.length > 0) return [];
    // exclude services already in cart
    const inCartUuids = new Set(cartItems.map((i) => String(i.id)));
    const list = (staticServices || [])
      .filter((s) => !inCartUuids.has(String(s.id)))
      .slice(0, 6)
      .map((s) => ({
        serviceId: s.id,
        serviceUuid: s.id,
        serviceName: s.name,
        price: s.price,
        reason: "fallback",
      }));
    return list;
  }, [recommendations, cartItems]);
  // Prefetch service objects for any suggestions (recommended / public fallback / static fallback)
  useEffect(() => {
    const items =
      recommendations && recommendations.length > 0
        ? recommendations
        : publicFallback && publicFallback.length > 0
        ? publicFallback
        : fallbackRecommendations;

    const uuids = new Set<string>();
    items.forEach((it) => {
      const u = resolveServiceUuid(it as any);
      if (u) uuids.add(u);
    });

    const missing = Array.from(uuids).filter((u) => !remoteServices[u]);
    console.debug(
      "[recommendation] prefetch candidate uuids:",
      Array.from(uuids)
    );
    console.debug(
      "[recommendation] remoteServices cached uuids:",
      Object.keys(remoteServices)
    );
    if (missing.length === 0) {
      console.debug("[recommendation] no missing uuids to prefetch");
      return;
    }
    console.debug(
      "[recommendation] will prefetch missing uuids:",
      missing,
      "axios baseURL:",
      axiosPublic && (axiosPublic as any).defaults
        ? (axiosPublic as any).defaults.baseURL
        : undefined
    );

    let mounted = true;
    (async () => {
      try {
        const results = await Promise.all(
          missing.map((u) =>
            axiosPublic
              .get(`/service/${u}`)
              .then((r) => {
                console.debug(
                  "[recommendation] prefetch success for",
                  u,
                  "status",
                  r.status
                );
                return r.data;
              })
              .catch((e) => {
                console.debug(
                  "[recommendation] prefetch failed for",
                  u,
                  e?.response?.status ?? e?.message ?? e
                );
                return null;
              })
          )
        );
        if (!mounted) return;
        const updates: Record<string, any> = {};
        results.forEach((s) => {
          if (s && s.id) updates[s.id] = s;
        });
        if (Object.keys(updates).length > 0) {
          console.debug(
            "[recommendation] prefetch updates:",
            Object.keys(updates)
          );
          setRemoteServices((prev) => ({ ...prev, ...updates }));
        } else {
          console.debug("[recommendation] prefetch found no valid services");
        }
      } catch (e) {
        console.debug("[recommendation] prefetch services error", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    recommendations,
    publicFallback,
    fallbackRecommendations,
    resolveServiceUuid,
  ]);
  const handleSelectDoctor = (doctorId: string) => {
    if (selectedDoctorId === doctorId) setSelectedDoctorId(null);
    else setSelectedDoctorId(doctorId);
  };

  const total = (groupedByDoctor[selectedDoctorId || ""] || []).reduce(
    (sum, i) => sum + i.price,
    0
  );

  const handleCheckout = () => {
    if (!selectedDoctorId) {
      message.warning("Hãy chọn nhóm bác sĩ trước khi đặt lịch!");
      return;
    }

    const selectedServices = groupedByDoctor[selectedDoctorId];

    navigate(configRoutes.bookings, {
      state: { doctorId: selectedDoctorId, services: selectedServices },
    });
  };

  const handleBack = () => navigate(configRoutes.services);

  const handleRefreshRecommendations = useCallback(() => {
    console.debug(
      "[recommendation] ====== MANUAL REFRESH BUTTON CLICKED ======"
    );
    if (isLoadingRecommendations) {
      console.debug("[recommendation] refresh ignored — already loading");
      message.warning("Đang tải gợi ý, vui lòng đợi...");
      return;
    }
    console.debug("[recommendation] calling loadRecommendations now...");
    message.info("Đang tải gợi ý...");
    void loadRecommendations();
  }, [loadRecommendations, isLoadingRecommendations]);

  const SuggestionTitle: React.FC<{
    serviceUuid?: string | null;
    serviceId?: string;
    fallback?: string;
  }> = ({ serviceUuid, serviceId, fallback }) => {
    // Use the UUID directly - already resolved by parent render
    const lookupUuid = serviceUuid || "";
    console.log("[SuggestionTitle] uuid:", lookupUuid, "fallback:", fallback);

    const svcFromCache = lookupUuid ? remoteServices[lookupUuid] : undefined;
    const {
      data: svcFromHook,
      isLoading,
      error,
    } = useGetServiceByIdQuery(lookupUuid, { skip: !lookupUuid });

    // Log RTK Query state in detail
    if (lookupUuid && !svcFromCache) {
      console.log("[SuggestionTitle] RTK Query state:", {
        uuid: lookupUuid,
        data: svcFromHook,
        isLoading,
        error: error ? JSON.stringify(error) : null,
        hasData: !!svcFromHook,
        dataName: svcFromHook?.name,
      });
    }

    const displayName =
      svcFromCache?.name ?? svcFromHook?.name ?? fallback ?? "Dịch vụ gợi ý";
    console.log(
      "[SuggestionTitle] result:",
      displayName,
      "(cache:",
      !!svcFromCache,
      "hook:",
      !!svcFromHook,
      "loading:",
      isLoading,
      ")"
    );

    return <>{displayName}</>;
  };

  const pendingServiceId = pendingItemToAdd?.uuid ?? "";
  const { data: pendingServiceData, isLoading: isLoadingPendingService } =
    useGetPublicServiceByIdQuery(pendingServiceId, { skip: !pendingServiceId });
  return (
    <section className={styles.cartSection}>
      <div className={styles.container}>
        <div className={styles.backWrapper}>
          <Button
            type="link"
            icon={<ArrowLeft size={18} />}
            onClick={handleBack}
            className={styles.backButton}
          >
            Quay lại danh sách dịch vụ
          </Button>
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.cartContent}>
            <Title
              level={2}
              className="cus-text-primary"
              style={{ marginBottom: 24 }}
            >
              Giỏ dịch vụ của bạn
            </Title>

            {cartItems.length === 0 ? (
              <div className={styles.emptyStateWrapper}>
                <div className={styles.emptyIcon}>
                  <ShoppingCart size={64} strokeWidth={1.5} />
                </div>
                <div className={styles.emptyText}>
                  Chưa có dịch vụ nào trong giỏ hàng
                </div>
                <button className={styles.emptyButton} onClick={handleBack}>
                  Tiếp tục mua sắm
                </button>
              </div>
            ) : (
              <div className={styles.doctorGroupsWrapper}>
                {Object.entries(groupedByDoctor).map(([doctorId, items]) => {
                  const doctor = items[0]?.doctor;
                  const isSelected = selectedDoctorId === doctorId;
                  const doctorTotal = items.reduce(
                    (sum, i) => sum + i.price,
                    0
                  );

                  return (
                    <div
                      key={doctorId}
                      className={`${styles.doctorGroup} ${
                        isSelected ? styles.activeDoctor : ""
                      }`}
                      onClick={() => handleSelectDoctor(doctorId)}
                    >
                      <div className={styles.doctorHeader}>
                        <div className={styles.doctorInfo}>
                          <h3 className={styles.doctorName}>
                            {doctor?.name || "Không rõ bác sĩ"}
                          </h3>
                          <span className={styles.doctorSub}>
                            {items.length} dịch vụ • Tổng:{" "}
                            {doctorTotal.toLocaleString()}đ
                          </span>
                        </div>
                        <button
                          className={`${styles.selectButton} ${
                            isSelected ? styles.selected : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDoctor(doctorId);
                          }}
                        >
                          {isSelected ? "✓ Đã chọn" : "Chọn"}
                        </button>
                      </div>

                      <div className={styles.itemsContainer}>
                        {items.map((item) => (
                          <div key={item.id} className={styles.serviceCard}>
                            <div className={styles.serviceImageWrapper}>
                              <img
                                alt={item.name}
                                src={item.images?.[0]?.url || NoImage}
                                className={styles.serviceImage}
                              />
                            </div>
                            <div className={styles.serviceContentWrapper}>
                              <h4 className={styles.serviceName}>
                                {item.name}
                              </h4>
                              <div className={styles.servicePrice}>
                                {item.price.toLocaleString()}đ
                              </div>
                              <div className={styles.serviceActions}>
                                <button
                                  className={styles.deleteBtn}
                                  onClick={() => handleDeleteFromCart(item.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            {selectedDoctorId && (
              <Card className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Tóm tắt đơn hàng</h3>

                <div className={styles.summaryRow}>
                  <span className={styles.label}>Tạm tính:</span>
                  <span className={styles.value}>
                    {total.toLocaleString()}đ
                  </span>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryTotal}>
                  <span className={styles.label}>Tổng cộng:</span>
                  <span>{total.toLocaleString()}đ</span>
                </div>

                <button
                  type="primary"
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                >
                  Đặt lịch ngay
                </button>

                <Button
                  type="link"
                  block
                  onClick={handleBack}
                  style={{ marginTop: 10 }}
                >
                  Tiếp tục xem dịch vụ
                </Button>
              </Card>
            )}

            {cartItems.length > 0 && (
              <Card className={styles.recommendationCard}>
                <h4 style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, textTransform: 'uppercase' }}>
                  GỢI Ý DỊCH VỤ DÀNH CHO BẠN
                </h4>
                <div className={styles.recommendationHeader}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Select
                      value={suggestCount}
                      onChange={(v) => setSuggestCount(Number(v))}
                      options={[
                        { value: 3, label: "3" },
                        { value: 6, label: "6" },
                        { value: 9, label: "9" },
                      ]}
                      style={{ width: 90 }}
                    />
                    <Button
                      type="default"
                      icon={<RotateCcw size={16} />}
                      onClick={handleRefreshRecommendations}
                      loading={isLoadingRecommendations}
                      className={styles.recommendationRefresh}
                    >
                      Làm mới
                    </Button>
                  </div>
                </div>

                {!selectedDoctorId && (
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 12, fontSize: 12 }}
                  >
                    Chọn một bác sĩ để hệ thống thêm nhanh dịch vụ gợi ý vào
                    giỏ.
                  </Text>
                )}

                {recommendationError ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="Không thể tải gợi ý dịch vụ"
                    description={recommendationError}
                  />
                ) : isLoadingRecommendations ? (
                  <div className={styles.recommendationLoading}>
                    <Spin />
                  </div>
                ) : (
                  <div className={styles.recommendationList}>
                    {(recommendations && recommendations.length > 0
                      ? recommendations
                      : publicFallback && publicFallback.length > 0
                      ? publicFallback
                      : fallbackRecommendations
                    )
                      .filter((item) => {
                        // Filter out services that are already in cart
                        const itemUuid = resolveServiceUuid(item as any);
                        if (!itemUuid) return true; // Keep items we can't resolve
                        
                        // Check if this service is already in cart
                        return !cartItems.some((cartItem) => {
                          const cartUuid = extractUuidFromCartItem(cartItem);
                          return cartUuid === itemUuid;
                        });
                      })
                      .map((item) => {
                      const resolvedUuid = resolveServiceUuid(item as any);
                      const cachedService = resolvedUuid
                        ? remoteServices[resolvedUuid]
                        : undefined;
                      const cachedPrice = cachedService?.price;
                      const priceValue =
                        typeof cachedPrice === "number"
                          ? cachedPrice
                          : typeof item.price === "number"
                          ? item.price
                          : null;
                      const priceText =
                        priceValue !== null
                          ? `${priceValue.toLocaleString("vi-VN")}đ`
                          : null;
                      const scoreLabel =
                        typeof item.score === "number"
                          ? item.score <= 1
                            ? `Phù hợp ${(item.score * 100).toFixed(0)}%`
                            : `Điểm ${item.score.toFixed(1)}`
                          : null;
                      
                      // Get image from cached service (Cloudinary URL), fallback to recommendation imageUrl, then NoImage
                      const imageUrl = cachedService?.images?.[0]?.url || item.imageUrl || NoImage;

                      return (
                        <div
                          className={styles.recommendationItem}
                          key={item.serviceUuid ?? item.serviceId}
                        >
                          <img
                            src={imageUrl}
                            alt={item.serviceName || "Dịch vụ gợi ý"}
                            className={styles.recommendationImage}
                          />
                          <div className={styles.recommendationContent}>
                            <div className={styles.recommendationTitle}>
                              <SuggestionTitle
                                serviceUuid={resolvedUuid ?? item.serviceUuid}
                                serviceId={item.serviceId}
                                fallback={item.serviceName}
                              />
                            </div>
                            <div className={styles.recommendationMeta}>
                              {item.doctorName && (
                                <span>Bác sĩ: {item.doctorName}</span>
                              )}
                              {scoreLabel && (
                                <span className={styles.scoreTag}>
                                  {scoreLabel}
                                </span>
                              )}
                              {item.reason && (
                                <span className={styles.reasonTag}>
                                  {item.reason}
                                </span>
                              )}
                            </div>
                            {priceText && (
                              <div className={styles.recommendationPrice}>
                                {priceText}
                              </div>
                            )}
                            <div className={styles.recommendationActions}>
                              <Button
                                type="primary"
                                size="small"
                                icon={<ShoppingCart size={16} />}
                                loading={
                                  addingRecommendationId ===
                                  (item.serviceUuid ?? item.serviceId)
                                }
                                onClick={() =>
                                  void handleAddRecommendation(item)
                                }
                              >
                                Thêm vào giỏ
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Doctor selection modal for adding recommendation when no doctor chosen */}
        <Modal
          title={
            pendingServiceData
              ? `Chọn bác sĩ cho dịch vụ "${pendingServiceData?.name || ""}"`
              : "Chọn bác sĩ"
          }
          open={doctorModalVisible}
          onCancel={() => {
            setDoctorModalVisible(false);
            setPendingItemToAdd(null);
            setSelectedDoctorModalId(null);
          }}
          onOk={async () => {
            if (!selectedDoctorModalId) {
              message.warning("Vui lòng chọn bác sĩ trước khi xác nhận");
              return;
            }
            if (!pendingItemToAdd) return;
            try {
              setAddingRecommendationId(pendingItemToAdd.uuid);
              await addToCartMutation({
                customerId: String(auth?.accountId),
                doctorId: selectedDoctorModalId,
                itemData: { itemId: pendingItemToAdd.uuid, quantity: 1 },
              }).unwrap();
              try {
                const svcRes = await axiosPublic.get(
                  `/service/${pendingItemToAdd.uuid}`
                );
                if (svcRes?.data?.id)
                  setRemoteServices((prev) => ({
                    ...prev,
                    [svcRes.data.id]: svcRes.data,
                  }));
              } catch (e) {
                console.debug("[cart] fetch service after modal add failed", e);
              }
              message.success("Đã thêm vào giỏ hàng");
              await handleGetCart();
            } catch (err) {
              console.error("[cart] add from modal failed", err);
              message.error("Thêm thất bại");
            } finally {
              setAddingRecommendationId(null);
              setDoctorModalVisible(false);
              setPendingItemToAdd(null);
              setSelectedDoctorModalId(null);
            }
          }}
          okText="Thêm vào giỏ"
          cancelText="Hủy"
          width={600}
        >
          {isLoadingPendingService ? (
            <div>Đang tải...</div>
          ) : !pendingServiceData ||
            !pendingServiceData.doctors ||
            pendingServiceData.doctors.length === 0 ? (
            <Empty description="Không có bác sĩ nào khả dụng cho dịch vụ này" />
          ) : (
            <List
              dataSource={pendingServiceData.doctors}
              renderItem={(doctor) => (
                <div
                  onClick={() => setSelectedDoctorModalId(doctor.id)}
                  style={{
                    cursor: "pointer",
                    padding: 8,
                    background:
                      selectedDoctorModalId === doctor.id
                        ? "#f0f7ff"
                        : undefined,
                  }}
                  key={doctor.id}
                >
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={doctor.avatar} />}
                      title={doctor.name}
                      description={doctor.specialization}
                    />
                  </List.Item>
                </div>
              )}
            />
          )}
        </Modal>
      </div>
    </section>
  );
};

export default CartPage;
