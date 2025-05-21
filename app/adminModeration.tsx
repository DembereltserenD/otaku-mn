import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "@/context/ThemeProvider";
import Typography from "@/components/Typography";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, AlertTriangle, Shield, MessageSquare } from "lucide-react-native";

interface Report {
  id: number;
  content_type: string;
  content_id: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_name?: string;
  content_title?: string;
}

/**
 * AdminModeration component for managing content moderation
 * Allows administrators to review and handle user reports
 */
export default function AdminModeration() {
  const { colors } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, [filter]);

  // Fetch reports from database
  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("content_reports")
        .select(`
          *,
          users!reported_by(username),
          anime(title)
        `)
        .order("created_at", { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Format the data
      const formattedData = data?.map(report => ({
        ...report,
        user_name: report.users?.username || 'Unknown User',
        content_title: report.content_type === 'anime' ? report.anime?.title : 'Unknown Content'
      })) || [];
      
      setReports(formattedData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Error", "Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // Handle report action
  const handleReportAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("content_reports")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state
      setReports(reports.map(report => 
        report.id === id ? { ...report, status } : report
      ));
      
      Alert.alert(
        "Success", 
        `Report ${status === 'approved' ? 'approved' : 'rejected'} successfully`
      );
    } catch (error) {
      console.error(`Error ${status} report:`, error);
      Alert.alert("Error", `Failed to ${status} report. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.warning;
    }
  };

  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'anime': return <Shield size={16} color={colors.primary} />;
      case 'comment': return <MessageSquare size={16} color={colors.info} />;
      default: return <AlertTriangle size={16} color={colors.warning} />;
    }
  };

  // Render report item
  const renderReportItem = ({ item }: { item: Report }) => {
    return (
      <View style={[styles.reportItem, { backgroundColor: colors.card }]}>
        <View style={styles.reportHeader}>
          <View style={styles.reportType}>
            {getContentTypeIcon(item.content_type)}
            <Typography variant="bodySmall" style={{ marginLeft: 4, color: colors.textSecondary }}>
              {item.content_type.toUpperCase()}
            </Typography>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Typography variant="bodySmall" style={{ color: getStatusColor(item.status) }}>
              {item.status.toUpperCase()}
            </Typography>
          </View>
        </View>
        
        <Typography variant="body" style={{ fontWeight: '600', fontSize: 16, marginTop: 8 }}>
          {item.content_title}
        </Typography>
        
        <Typography variant="body" style={{ marginTop: 4 }}>
          {item.reason}
        </Typography>
        
        <View style={styles.reportFooter}>
          <Typography variant="bodySmall" style={{ color: colors.textSecondary }}>
            Reported by: {item.user_name}
          </Typography>
          <Typography variant="bodySmall" style={{ color: colors.textSecondary }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Typography>
        </View>
        
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
              onPress={() => handleReportAction(item.id, 'rejected')}
            >
              <XCircle size={18} color={colors.error} />
              <Typography variant="bodySmall" style={{ color: colors.error, marginLeft: 4 }}>
                Reject
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
              onPress={() => handleReportAction(item.id, 'approved')}
            >
              <CheckCircle size={18} color={colors.success} />
              <Typography variant="bodySmall" style={{ color: colors.success, marginLeft: 4 }}>
                Approve
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">Content Moderation</Typography>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filter === 'pending' && { backgroundColor: colors.warning + '20' }
          ]}
          onPress={() => setFilter('pending')}
        >
          <Typography 
            variant="bodySmall" 
            style={{ color: filter === 'pending' ? colors.warning : colors.textSecondary }}
          >
            Pending
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filter === 'approved' && { backgroundColor: colors.success + '20' }
          ]}
          onPress={() => setFilter('approved')}
        >
          <Typography 
            variant="bodySmall" 
            style={{ color: filter === 'approved' ? colors.success : colors.textSecondary }}
          >
            Approved
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filter === 'rejected' && { backgroundColor: colors.error + '20' }
          ]}
          onPress={() => setFilter('rejected')}
        >
          <Typography 
            variant="bodySmall" 
            style={{ color: filter === 'rejected' ? colors.error : colors.textSecondary }}
          >
            Rejected
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filter === 'all' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setFilter('all')}
        >
          <Typography 
            variant="bodySmall" 
            style={{ color: filter === 'all' ? colors.primary : colors.textSecondary }}
          >
            All
          </Typography>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography variant="body" style={{ color: colors.textSecondary }}>
              No {filter !== 'all' ? filter : ''} reports found.
            </Typography>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  list: {
    paddingBottom: 16,
  },
  reportItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportType: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
});
